import {outputJSON, readJSON} from 'fs-extra'
import {join} from 'node:path'

const MODULE = 'module.txt'

type Options = {
    dryRun?: boolean
}

export type ModuleDependency = {
    id: string,
    optional?: boolean,
    minVersion: string
}

export type ModuleInfo = {
    id: string,
    version: string,
    displayName?: string,
    dependencies: [ModuleDependency]
}

async function readModuleInfo(moduleDir: string): Promise<ModuleInfo> {
  const moduleInfoFile = join(moduleDir, MODULE)
  return readJSON(moduleInfoFile)
}

async function writeModuleInfo(moduleDir: string, moduleInfo: ModuleInfo, options: Options = {}): Promise<string> {
  const moduleInfoFile = join(moduleDir, MODULE)

  if (!options.dryRun) {
    await outputJSON(moduleInfoFile, moduleInfo, {spaces: 4})
    return moduleInfoFile
  }

  return moduleInfoFile
}

export {
  readModuleInfo,
  writeModuleInfo,
}
