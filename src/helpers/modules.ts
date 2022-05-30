//@ts-check

import { readModuleInfo, writeModuleInfo } from "./io";
const semver = require("semver");

type Options = {
  dryRun?: boolean
}

async function increment(module: string, level: string, options: Options) {
  const moduleInfo = await readModuleInfo(module);

  const currentVersion = moduleInfo.version;
  if (level.startsWith("pre")) {
    moduleInfo.version = semver.inc(currentVersion, level.substring(3)) + "-SNAPSHOT";
  } else {
    moduleInfo.version = semver.inc(currentVersion, level);
  }

  if (!options.dryRun) {
    await writeModuleInfo(module, moduleInfo, options);
  }

  return {
    id: moduleInfo.id,
    oldVersion: currentVersion,
    newVersion: moduleInfo.version
  }
}

async function updateDependency(module: string, dependency: string, version: string, options: Options) {
  const moduleInfo = await readModuleInfo(module);

  const entry = moduleInfo.dependencies.find(el => el.id === dependency);
  if (entry) {
    const currentVersion = entry.minVersion;
    entry.minVersion = version

    if (!options.dryRun) {
      await writeModuleInfo(module, moduleInfo, options);
    }

    return {
      id: moduleInfo.id,
      oldVersion: currentVersion,
      newVersion: version
    }
  }
  return {
    id: moduleInfo.id
  }
}

export {
  increment,
  updateDependency,
};
