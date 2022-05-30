import {Command, Flags} from '@oclif/core'
import chalk = require('chalk');
import {basename} from 'node:path'
import asyncPool = require('tiny-async-pool');

import {increment, updateDependency} from '../../helpers/modules'
import {findRoot, listModules} from '../../helpers/workspace'

export default class Bump extends Command {
  static description = chalk`Bump the version for a specific module, and update all references ({italic module.txt})`;

  static examples = ['gooey-cli module:bump'];

  /** Semver scopes for version increments. */
  static scopes = [
    'major',
    'minor',
    'patch',
    'premajor',
    'preminor',
    'prepatch',
  ];

  static flags = {
    'dry-run': Flags.boolean({
      char: 'n',
      description: 'Perform a dry run without any changes made.',
    }),
    scope: Flags.string({
      char: 's',
      description: 'Increment a version by the specified level.',
      options: this.scopes,
      default: 'minor',
    }),
  };

  static args = [
    {
      name: 'module',
      description: 'The module to increment the version on.',
    },
  ];

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Bump)

    const workspace = await findRoot(process.cwd())
    const modules = await listModules(workspace)

    const target = args.module ?? basename(process.cwd())

    const targetModule = modules.find(el => el.endsWith(target))

    if (!targetModule) {
      this.error(`Unknown module: ${target}`)
    }

    const {oldVersion, newVersion} = await increment(targetModule, flags.scope, {
      dryRun: flags['dry-run'],
    })

    if (!newVersion) {
      this.error(`Could not increment version on module ${targetModule} with scope '${flags.scope}'`)
    }

    this.log(
      chalk.bold(target.padEnd(32)) +
        ': ' +
        chalk.dim(oldVersion?.padEnd(18)) +
        ' ⇢ ' +
        newVersion.padEnd(18),
    )

    const task = async (m: string) =>
      updateDependency(m, target, newVersion, {
        dryRun: flags['dry-run'],
      })

    for await (const info of asyncPool(8, modules, task)) {
      if (info.newVersion) {
        this.log(
          '  ' +
            info.id.padEnd(30) +
            ': ' +
            chalk.dim(info.oldVersion?.padEnd(18)) +
            ' ⇢ ' +
            info.newVersion.padEnd(18),
        )
      }
    }
  }
}
