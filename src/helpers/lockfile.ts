import { listLibs, listModules } from "./workspace";
import { getRef } from "./git";

import * as fs from "fs-extra";
import { join, resolve, relative, basename } from "path";

type Options = {
  exact: boolean;
}

async function moduleLock(workspace: string, options: Options) {
  const modules = await listModules(workspace);
  const entries = await Promise.all(modules.map(async dir => {
    const ref = await getRef(dir, options.exact);
    const moduleInfo = JSON.parse(fs.readFileSync(resolve(dir, "module.txt"), 'utf8'));

    return {
      name: moduleInfo.id,
      version: moduleInfo.version,
      dir: relative(workspace, dir),
      ref
    }
  }));

  let result: {[index:string]: {name: string, version: string, ref: string}} = {}

  for (const m of entries) {
    result[m.dir] = {
      name: m.name,
      version: m.version,
      ref: m.ref
    }
  }
  return result;
}

async function libLock(workspace:string, options: Options) {
  const libs = await listLibs(workspace);
  console.log(JSON.stringify(libs, null, 2));
  const entries = await Promise.all(libs.map(async dir => {
    const ref = await getRef(dir, options.exact);

    return {
      name: basename(dir),
      version: "",
      dir: relative(workspace, dir),
      ref
    }
  }));

  let result: {[index:string]: {name: string, version: string, ref: string}} = {}

  for (const m of entries) {
    result[m.dir] = {
      name: m.name,
      version: m.version,
      ref: m.ref
    }
  }
  return result;
}

async function lockfile(workspace:string, options: Options) {
  const engineInfo = JSON.parse(fs.readFileSync(join(workspace, "engine/src/main/resources/org/terasology/engine/module.txt"), "utf-8"));
  const ref = await getRef(workspace, options.exact);

  let lock = {
    name: "Terasology",
    version: engineInfo.version,
    ref,
    lockfileVersion: 1,
    modules: await moduleLock(workspace, options),
    libs: await libLock(workspace, options),
  }

  return lock;
}

export {
  lockfile,
};