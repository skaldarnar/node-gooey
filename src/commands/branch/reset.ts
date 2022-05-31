import {findRoot, listModules, listLibs} from '../../helpers/workspace'
import {reset, ResetResult} from '../../helpers/git'

import chalk = require('chalk')
import asyncPool = require('tiny-async-pool')
import {Command, Flags} from '@oclif/core'
import {GitError} from 'simple-git'

export default class Reset extends Command {
  static summary = 'Reset a workspace element to the latest state of the default upstream branch.'

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
  }

  public async run(): Promise<void> {
    const workspace = await findRoot(process.cwd())
    const {flags} = await this.parse(Reset)

    for (const element of flags.categories) {
      await this._reset(element, workspace, flags)
    }
  }

  async _reset(element: string, workspace: string, argv: {force:boolean}): Promise<void> {
    const task = async (m: string) => reset(m, {force: argv.force, fetch: true})
    switch (element) {
    case 'root': {
      console.log(chalk.bold('workspace'))
      const result = await task(workspace)
      this._updateMsg('root', result, '  ')
      break}

    case 'modules': {
      const modules = await listModules(workspace)
      if (modules.length > 0) {
        console.log(chalk`{bold ${element}}`)
        for await (const result of asyncPool(16, modules, task))  this._updateMsg('module', result, '  ')
      }

      break}

    case 'libs': {
      const libs = await listLibs(workspace)
      if (libs.length > 0) {
        console.log(chalk`{bold ${element}}`)
        for await (const result of asyncPool(16, libs, task))  this._updateMsg('lib', result, '  ')
      }}
    }
  }

  _updateMsg(category: string, info: ResetResult, indent: string): void {
    // console.debug(JSON.stringify(info, null, 2))
    let msg = indent || ''
    msg += chalk`{dim ${category.padStart(6)}} ${info.name.padEnd(32)}`

    const error = info.summary as GitError

    if (typeof error.message === 'string') {
      msg += chalk.bold.red(info.before.current)
      msg += '\n' + chalk.italic.red(error.message.replace(/^/gm, indent + '  '))
    } else if (this._hasChanged(info)) {
      msg += chalk.bold.green(info.after.current?.padEnd(24))
      msg += chalk.grey(info.before.ref.slice(0, 8) + '...' + info.after.ref.slice(0, 8))
    } else {
      msg += chalk.cyan(info.after.current)
    }

    console.log(msg)
  }

  _hasChanged(info: ResetResult): boolean {
    return info.before.ref !== info.after.ref
  }
}
