import {Command, Flags} from '@oclif/core'
import chalk = require('chalk')
import { Listr, ListrTask } from 'listr2';
import asyncPool = require('tiny-async-pool');

import {status, StatusSummary} from '../../helpers/git'
import {findRoot, listLibs, listModules} from '../../helpers/workspace'

type StatusOptions = {
  offline: boolean,
  verbose: boolean
}

export default class Status extends Command {
  static description = 'Inspect the workspace or a specific workspace element.';

  static examples = ['$ gooey-cli workspace:status'];

  static categories = ['root', 'libs', 'modules'];

  static flags = {
    offline: Flags.boolean({
      description: chalk`fetch remote state before showing state ({italic git fetch})`,
      default: false,
    }),
    categories: Flags.string({
      name: 'categories',
      description: chalk`the categories of sub-repositories to work on. (default {italic all})`,
      default: this.categories,
      options: this.categories,
      multiple: true,
    }),
    verbose: Flags.boolean(),
  };

  static args = [];

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Status)

    const workspace = await findRoot(process.cwd())

    const tasks = flags.categories.map(c => this.categoryTask(workspace, c, flags))

    new Listr(
      tasks, {
        concurrent: true,
        rendererOptions: {
          collapse: false
        }
      }
    ).run()
  }

  async repos(category: string, options: {workspace: string}): Promise<string[]> {
    switch (category) {
      case 'root':
        return [options.workspace]
      case 'libs':
        return listLibs(options.workspace)
      case 'modules':
        return listModules(options.workspace)
    }

    throw new Error(`Unknown workspace category "${category}"`)
  }

  categoryTask(workspace: string, category: string, options: StatusOptions): ListrTask {  
    return {
      title: chalk.bold(category),
      skip: async (ctx) => {
        const repos = await this.repos(category, {workspace})
        ctx.repos = repos
        return repos.length === 0
      },
      task: async (ctx, task) => {
        const repos = ctx.repos as string[]
        const tasks = repos.map(r => this.repoTask(category, r, options))
        return task.newListr(tasks, {concurrent: true})}
    }
  }

  repoTask(category: string, repo: string, options: StatusOptions): ListrTask {
    return {
      title: repo,
      task: async (_, task) => {
        const info = await status(repo, !options.offline)
        const msg = await this.statusMsg(category, info, options)
        task.title = msg
      }
    }
  }

  remoteStatusSymbol(ahead: number, behind: number): string {
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

  statusMsg(category: string, info: StatusSummary, options: StatusOptions): string {
    const branch = (info: StatusSummary) => {
      const b = info.status.current ?? ''
      if (b.length > 16) {
        return (b.slice(0, 16) + '…').padEnd(18)
      }

      return b.padEnd(18)
    }

    let msg = chalk`{dim ${category.padStart(8)}} ${info.name.padEnd(32)}`

    const statusSymbol = this.remoteStatusSymbol(
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
      msg += chalk.yellow(branch(info))
      msg += chalk.grey(info.status.ref.slice(0, 8))
      if (options.verbose) {
        for (const f of info.status.files)  (msg += `\n\t${f.index}${f.working_dir} ${f.path}`)
      }      
    }

    return msg
  }
}
