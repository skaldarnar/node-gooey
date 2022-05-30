import {listLibs, listModules} from './workspace'
import {getRef} from './git'

import * as fs from 'fs-extra'
import {join, resolve, relative, basename} from 'node:path'

type Options = {
  exact: boolean;
}

export type Lock = {
    name: string,
    version: string,
    dir?: string,
    ref: string,
  }

export type Lockfile = Lock & {
  lockfileVersion: number,
  modules: {[index:string]: Lock},
  libs: {[index:string]: Lock},
}

async function moduleLock(workspace: string, options: Options): Promise<{[index:string]: Lock}> {
  const modules = await listModules(workspace)
  const entries = await Promise.all(modules.map(async dir => {
    const ref = await getRef(dir, options.exact)
    const moduleInfo = JSON.parse(fs.readFileSync(resolve(dir, 'module.txt'), 'utf8'))

    return {
      name: moduleInfo.id,
      version: moduleInfo.version,
      dir: relative(workspace, dir),
      ref,
    }
  }))

  const result: {[index:string]: Lock} = {}

  for (const m of entries) {
    result[m.dir] = {
      name: m.name,
      version: m.version,
      ref: m.ref,
    }
  }

  return result
}

async function libLock(workspace:string, options: Options): Promise<{[index:string]: Lock}> {
  const libs = await listLibs(workspace)
  console.log(JSON.stringify(libs, null, 2))
  const entries = await Promise.all(libs.map(async dir => {
    const ref = await getRef(dir, options.exact)

    return {
      name: basename(dir),
      version: '',
      dir: relative(workspace, dir),
      ref,
    }
  }))

  const result: {[index:string]: Lock} = {}

  for (const m of entries) {
    result[m.dir] = {
      name: m.name,
      version: m.version,
      ref: m.ref,
    }
  }

  return result
}

async function lockfile(workspace:string, options: Options): Promise<Lockfile> {
  const engineInfo = JSON.parse(fs.readFileSync(join(workspace, 'engine/src/main/resources/org/terasology/engine/module.txt'), 'utf-8'))

  if (typeof engineInfo.version !== 'string') {
    throw new TypeError('Terasology engine version not found.')
  }

  const version: string = engineInfo.version

  const ref = await getRef(workspace, options.exact)

  const lock = {
    name: 'Terasology',
    version,
    ref,
    lockfileVersion: 1,
    modules: await moduleLock(workspace, options),
    libs: await libLock(workspace, options),
  }

  return lock
}

export {
  lockfile,
}
