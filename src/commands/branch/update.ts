import chalk = require('chalk')
import asyncPool = require('tiny-async-pool')
import {Command, Flags} from '@oclif/core'
import {GitError, PullResult} from 'simple-git'

import {findRoot, listModules, listLibs} from '../../helpers/workspace'
import {update, UpdateResult} from '../../helpers/git'

export default class Update extends Command {
  static summary = 'Update a workspace element.'

  // TODO: make common abstract super-class to share the 'categories' argument
  static categories = ['root', 'libs', 'modules']
  static args = [
    {
      name: 'categories',
      description: chalk`the categories of sub-repositories to work on. (default {italic all})`,
      default: this.categories,
      options: this.categories,
    },
  ]

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Discard all local changes withut asking.',
    }),
  }

  public async run(): Promise<void> {
    const workspace = await findRoot(process.cwd())
    const {args, flags} = await this.parse(Update)

    for (const element of args.categories) {
      await _update(element, workspace, flags)
    }
  }
}

async function _update(element: string, workspace: string, argv: {force: boolean}) {
  const task = async (m: string): Promise<UpdateResult> => update(m, argv)

  switch (element) {
  case 'root': {
    console.log(chalk.bold('workspace'))
    const result = await task(workspace)
    _updateMsg('root', result, '  ')
    break
  }

  case 'modules': {
    const modules = await listModules(workspace)
    if (modules.length > 0) {
      console.log(chalk`{bold ${element}}`)
      for await (const result of asyncPool(16, modules, task))  _updateMsg('module', result, '  ')
    }

    break
  }

  case 'libs': {
    const libs = await listLibs(workspace)
    if (libs.length > 0) {
      console.log(chalk`{bold ${element}}`)
      for await (const result of asyncPool(16, libs, task))  _updateMsg('lib', result, '  ')
    }
  }
  }
}

function _updateMsg(category: string, info: UpdateResult, indent: string) {
  // console.debug(JSON.stringify(info, null, 2))
  let msg = indent || ''
  msg += chalk`{dim ${category.padStart(6)}} ${info.name.padEnd(32)}`

  const error = (info.summary as {error: GitError}).error

  if (error !== undefined) {
    msg += chalk.bold.red(info.before.current)
    msg += '\n' + chalk.italic.red(error.message.replace(/^/gm, indent + '  '))
  } else if (_hasChanged(info)) {
    msg += chalk.bold.green(info.after.current?.padEnd(24))
    msg += chalk.grey(info.before.ref.slice(0, 8) + '...' + info.after.ref.slice(0, 8))
  } else {
    msg += chalk.cyan(info.after.current)
  }

  console.log(msg)
}

function isPullResult(summary: PullResult | { error: GitError }) {
  return (summary as PullResult).summary !== undefined
}

function _hasChanged(info: UpdateResult) {
  if (info.before.ref !== info.after.ref) {
    return true
  }

  if (isPullResult(info.summary)) {
    return (info.summary as PullResult).summary.changes > 0
  }

  return false
}
