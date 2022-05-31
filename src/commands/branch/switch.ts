
import {findRoot, listModules, listLibs} from '../../helpers/workspace'
import {checkout, CheckoutResult} from '../../helpers/git'

import chalk = require('chalk')
import asyncPool = require('tiny-async-pool')
import {Command, Flags} from '@oclif/core'
import {GitError} from 'simple-git'

export default class Switch extends Command {
  static summary = 'Switch branches on workspace elements.'

    static args = [
      {
        name: 'branch',
        description: 'The branch to check out on the workspace elements.',
      },
    ]

    // TODO: make common abstract super-class to share the 'categories' argument
    static categories = ['root', 'libs', 'modules']
    static flags = {
      categories: Flags.string({
        char: 'c',
        description: chalk`the categories of sub-repositories to work on. (default {italic all})`,
        default: this.categories,
        options: this.categories,
        multiple: true,
      }),
      force: Flags.boolean({
        char: 'f',
        description: 'Discard all local changes withut asking.',
      }),
      'ignore-missing': Flags.boolean({
        description: 'Ignore invalid references to non-existing branches instead of failing the command.',
        default: true,
      }),
      offline: Flags.boolean({
        description: chalk`Switch branch without fetching latest state from remote.`,
        default: false,
      }),
    }

    public async run(): Promise<void> {
      const workspace = await findRoot(process.cwd())
      const {args, flags} = await this.parse(Switch)

      // this.log(JSON.stringify({args, flags}, null, 2))

      // This messes up the order of both both categories and elements...
      // Promise.all(flags.categories.map(category => this._switch(category, workspace, {...flags, branch: args.branch})))

      for (const category of flags.categories) {
        await this._switch(category, workspace, {...flags, branch: args.branch})
      }
    }

    async _switch(element: string, workspace: string, argv: {force: boolean, offline: boolean, 'ignore-missing': boolean, branch: string}): Promise<void> {
      const task = async (m: string): Promise<CheckoutResult> => checkout(m, {branch: argv.branch, force: argv.force, fetch: !argv.offline})

      switch (element) {
      case 'root': {
        console.log(chalk.bold('workspace'))
        const result = await task(workspace)
        this.statusMsg('root', result, '  ', argv)
        break
      }

      case 'modules': {
        const modules = await listModules(workspace)
        if (modules.length > 0) {
          console.log(chalk`{bold ${element}}`)
          for await (const result of asyncPool(16, modules, task)) {
            this.statusMsg('module', result, '  ', argv)
          }
        }

        break
      }

      case 'libs': {
        const libs = await listLibs(workspace)
        if (libs.length > 0) {
          console.log(chalk`{bold ${element}}`)
          for await (const result of asyncPool(16, libs, task)) {
            this.statusMsg('lib', result, '  ', argv)
          }
        }}
      }
    }

    statusMsg(category: string, info: CheckoutResult, indent: string, argv: {force: boolean, offline: boolean, 'ignore-missing': boolean, branch: string}): void {
      // console.debug(JSON.stringify(info, null, 2))

      let msg = indent || ''
      msg += chalk`{dim ${category.padStart(6)}} ${info.name.padEnd(32)}`

      const error = info.summary as GitError

      if (typeof error.message === 'string') {
        if (argv['ignore-missing'] && error.message.startsWith('fatal: invalid reference:')) {
          msg += chalk.grey(info.after.current)
        } else {
          msg += chalk.red(info.after.current)
          for (const f of error.message.split('\n'))  msg += chalk.red.italic`\n\t${f}`
        }
      } else if (this.hasChanged(info)) {
        msg += chalk.bold.green(info.after.current?.padEnd(24))
        msg += chalk.grey(`${info.before.current?.padStart(16)} ⇒ ${info.after.current}`)
      } else {
        msg += chalk`{cyan ${info.after.current?.padEnd(24)}}`
      }

      console.log(msg)
    }

    hasChanged(info: CheckoutResult): boolean {
      return info.before.ref !== info.after.ref
    }
}
