import {CliUx, Command, Flags} from '@oclif/core'
import chalk = require('chalk');
import {writeJson} from 'fs-extra'
import {join, resolve} from 'node:path'
import createDebug = require('debug')

import {lockfile} from '../../helpers/lockfile'
import {findRoot} from '../../helpers/workspace'

export default class WorkspacePin extends Command {
  static description =
    'Write a lock-file to pin module versions ({italic workspace-lock.json})';

  static examples = [
    'gooey-cli workspace:pin',
    'gooey-cli workspace:pin --exact --lockfile=terasology.lock',
  ];

  static flags = {
    lockfile: Flags.string({
      char: 'o',
      description: 'the lockfile for pinning/restoring a workspace',
    }),
    exact: Flags.boolean({
      description: 'pin the commit SHA instead of symbolic ref',
    }),
  };

  static args = [];

  public async run(): Promise<void> {
    const debug = createDebug('workspace:load')
    const {flags} = await this.parse(WorkspacePin)

    const root = await findRoot(process.cwd())

    const dest = flags.lockfile ?? join(root, 'workspace-lock.json')

    CliUx.ux.action.start(chalk.dim`computing lockfile for workspace`)
    const lock = await lockfile(root, {exact: flags.exact})
    debug(JSON.stringify(lock, null, 2))
    CliUx.ux.action.stop()

    CliUx.ux.action.start(chalk.dim`writing workspace lockfile`)

    this.debug(JSON.stringify(lock, null, 2))
    await writeJson(dest, lock, {spaces: 2})
    CliUx.ux.action.stop()

    this.log('\tfile:' + resolve(process.cwd(), dest))
  }
}
