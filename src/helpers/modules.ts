import {readModuleInfo, writeModuleInfo} from './io'

import semver = require('semver')

type Options = {
  dryRun?: boolean
}

type IncrementResult = {
  id: string,
  oldVersion?: string,
  newVersion?: string
}

async function increment(module: string, level: string, options: Options): Promise<IncrementResult> {
  const moduleInfo = await readModuleInfo(module)

  const currentVersion = moduleInfo.version
  // @ts-ignore
  const scope: semver.ReleaseType =  level.startsWith('pre') ? level.slice(3) : level
  const newVersion = level.startsWith('pre') ? semver.inc(currentVersion, scope) + '-SNAPSHOT' : semver.inc(currentVersion, scope)

  if (newVersion === null) {
    throw new Error(`Could not increment version '${currentVersion}' by semver scope '${scope}.`)
  }

  moduleInfo.version = newVersion

  if (!options.dryRun) {
    await writeModuleInfo(module, moduleInfo, options)
  }

  return {
    id: moduleInfo.id,
    oldVersion: currentVersion,
    newVersion: moduleInfo.version,
  }
}

async function updateDependency(module: string, dependency: string, version: string, options: Options): Promise<IncrementResult> {
  const moduleInfo = await readModuleInfo(module)

  const entry = moduleInfo.dependencies.find(el => el.id === dependency)
  if (entry) {
    const currentVersion = entry.minVersion
    entry.minVersion = version

    if (!options.dryRun) {
      await writeModuleInfo(module, moduleInfo, options)
    }

    return {
      id: moduleInfo.id,
      oldVersion: currentVersion,
      newVersion: version,
    }
  }

  return {
    id: moduleInfo.id,
  }
}

export {
  increment,
  updateDependency,
}
