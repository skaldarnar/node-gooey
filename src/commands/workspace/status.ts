import {Command, Flags} from '@oclif/core'
import chalk = require('chalk')
import asyncPool = require('tiny-async-pool');

import {status, StatusSummary} from '../../helpers/git'
import {findRoot, listLibs, listModules} from '../../helpers/workspace'

type StatusOptions = {
  offline: boolean;
};

export default class Status extends Command {
  static description = 'Inspect the workspace or a specific workspace element.';

  static examples = ['$ gooey-cli workspace:status'];

  static flags = {
    offline: Flags.boolean({
      description: chalk`fetch remote state before showing state ({italic git fetch})`,
      default: false,
    }),
  };

  static categories = ['root', 'libs', 'modules'];
  static args = [
    {
      name: 'categories',
      description: chalk`the categories of sub-repositories to work on. (default {italic all})`,
      default: this.categories,
      options: this.categories,
    },
  ];

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Status)

    const workspace = await findRoot(process.cwd())

    for (const category of args.categories) {
      this._view(category, workspace, {...flags})
    }
  }

  async _view(category: string, workspace: string, options: StatusOptions): Promise<void> {
    const task = async (m: string) => status(m, !options.offline)
    switch (category) {
    case 'root': {
      console.log(chalk.bold('workspace'))
      const result = await task(workspace)
      this._statusMsg('engine', result, '  ')
      break
    }

    case 'modules': {
      const modules = await listModules(workspace)
      if (modules.length > 0) {
        console.log(chalk`{bold ${category}}`)
        for await (const result of asyncPool(8, modules, task)) {
          this._statusMsg('module', result, '  ')
        }
      }

      break
    }

    case 'libs': {
      const libs = await listLibs(workspace)
      if (libs.length > 0) {
        console.log(chalk`{bold ${category}}`)
        for await (const result of asyncPool(8, libs, task)) {
          this._statusMsg('lib', result, '  ')
        }
      }

      break
    }
    }
  }

  _remoteStatusSymbol(ahead: number, behind: number): string {
    if (ahead && behind) {
      return chalk.bold('±')
    }

    if (ahead && !behind) {
      return chalk.bold('+')
    }

    if (!ahead && behind) {
      return chalk.bold('-')
    }

    return chalk.bold(' ')
  }

  _statusMsg(category: string, info: StatusSummary, indent: string): void {
    const branch = (info: StatusSummary) => {
      const b = info.status.current ?? ''
      if (b.length > 16) {
        return (b.slice(0, 16) + '…').padEnd(18)
      }

      return b.padEnd(18)
    }

    let msg = indent || ''
    msg += chalk`{dim ${category.padStart(6)}} ${info.name.padEnd(32)}`

    const statusSymbol = this._remoteStatusSymbol(
      info.status.ahead,
      info.status.behind,
    )
    msg += chalk`${statusSymbol.padEnd(2)} `

    if (
      info.status.ahead === 0 &&
      info.status.behind === 0 &&
      info.status.isClean()
    ) {
      msg += chalk.bold.green(branch(info))
      msg += chalk.grey(info.status.ref.slice(0, 8))
    } else if (info.status.isClean()) {
      msg += chalk.cyan(branch(info))
      msg += chalk.grey(info.status.ref.slice(0, 8))
    } else {
      msg += chalk`{yellow ${info.status.current}}`
      for (const f of info.status.files)  (msg += `\n\t${f.index}${f.working_dir} ${f.path}`)
    }

    console.log(msg)
  }
}
