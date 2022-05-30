import {join, resolve} from 'node:path'
import chalk = require('chalk')
import * as execa from 'execa'
import simpleGit from 'simple-git'
import {existsSync, pathExistsSync, readdir} from 'fs-extra'

async function findRoot(dir: string): Promise<string> {
  const git = simpleGit(dir, {binary: 'git'})
  try {
    const root = await git.revparse('--show-toplevel')
    if (await isRoot(root)) {
      return root
    }

    return await findRoot(resolve(root, '..'))
  } catch (error) {
    throw new Error(chalk.red.bold('Not in a Terasology workspace.', error))
  }
}

async function isRoot(dir: string): Promise<boolean> {
  const settings = join(dir, 'settings.gradle')
  try {
    execa.sync('grep', [
      "rootProject.name = 'Terasology'",
      settings,
    ])
    return true
  } catch {
    return false
  }
}

/**
 * Predicate to synchronously check whether a given directory is a module based on the presence of `module.txt`.
 *
 * @param dir path to a directory
 * @returns whether the directory is a Terasology module
 */
function isModule(dir: string): boolean {
  const moduleInfo = join(dir, 'module.txt')
  return pathExistsSync(moduleInfo)
}

async function listModules(workspace: string): Promise<Array<string>> {
  if (!workspace) return []
  const modules = (
    await readdir(join(workspace, 'modules'), {withFileTypes: true})
  )
  .filter(dir => dir.isDirectory())
  .map(dir => join(workspace, 'modules', dir.name))
  .filter(dir => isModule(dir))
  .sort()

  return modules
}

async function listLibs(workspace: string): Promise<Array<string>> {
  if (!workspace) return []
  const libs = (
    await readdir(join(workspace, 'libs'), {withFileTypes: true})
  )
  .filter(dir => dir.isDirectory())
  .map(dir => join(workspace, 'libs', dir.name))
  .filter(dir => existsSync(join(dir, '.git')))
  .sort()

  return libs
}

export {listLibs, listModules, findRoot, isRoot}
