//@ts-check

const io = require("./io");
const semver = require("semver");

async function increment(module, level, options) {
  const moduleInfo = await io.readModuleInfo(module);

  const currentVersion = moduleInfo.version;
  if (level.startsWith("pre")) {
    moduleInfo.version = semver.inc(currentVersion, level.substring(3)) + "-SNAPSHOT";
  } else {
    moduleInfo.version = semver.inc(currentVersion, level);
  }

  if (!options.dryRun) {
    await io.writeModuleInfo(module, moduleInfo, options);
    //await fs.writeJSON(moduleInfoFile, moduleInfo, { spaces: 4 });
  }

  return {
    id: moduleInfo.id,
    oldVersion: currentVersion,
    newVersion: moduleInfo.version
  }
}

async function updateDependency(module, dependency, version, options) {
  const moduleInfo = await io.readModuleInfo(module);

  const entry = moduleInfo.dependencies.find(el => el.id === dependency);
  if (entry) {
    const currentVersion = entry.minVersion;
    entry.minVersion = version

    if (!options.dryRun) {
      await io.writeModuleInfo(module, moduleInfo, { spaces: 4 });
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

module.exports = {
  increment,
  updateDependency,
};
