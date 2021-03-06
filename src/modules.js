//@ts-check

const io = require("./io");
const fs = require("fs-extra");
const semver = require("semver");
const git = require("isomorphic-git");
const { basename } = require("path");
const chalk = require("chalk");

const simpleGit = require('simple-git');
const gitw = simpleGit();

async function reset(dir) {
  const name = basename(dir).padEnd(32);
  const currentBranch = `[${await git.currentBranch({fs, dir})}]`.padStart(20);

  let msg = chalk`{dim reset module} ${name} ${currentBranch} >>> `
  try {
    await git.checkout({
      fs,
      dir,
      force: true,
      ref: "develop"
    });
    const newBranch = `[${await git.currentBranch({fs, dir})}]`.padEnd(20);
    msg += chalk.green(newBranch)
  } catch (err) {
    msg += chalk.red.bold(err.message);
  }
  return msg;
}

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
  reset,
};
