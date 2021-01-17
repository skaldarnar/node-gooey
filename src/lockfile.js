//@ts-check

const chalk = require("chalk");
const { listModules } = require("./modules");
const fs = require("fs-extra");
const { join, resolve, relative } = require("path");
const git = require("isomorphic-git");


async function moduleLock(workspace) {
  const modules = await listModules(workspace);
  const entries = await Promise.all(modules.map(async dir => {
    const sha = await git.resolveRef({
      fs, dir, ref: "HEAD"
    });
    const moduleInfo = JSON.parse(fs.readFileSync(resolve(dir, "module.txt"), 'utf8'));

    return {
      name: moduleInfo.id,
      version: moduleInfo.version,
      dir: relative(workspace, dir),
      sha
    }
  }));

  let result = {}

  for (const m of entries) {
    result[m.dir] = {
      name: m.name,
      version: m.version,
      sha: m.sha
    }
  }
  return result;
}

async function libLock(workspace) {
  console.log(chalk.yellow("Pinning libraries is not supported yet"));
  return {};
}

async function lockfile(workspace) {
  const engineInfo = JSON.parse(fs.readFileSync(join(workspace, "engine/src/main/resources/engine-module.txt"), "utf-8"));
  const sha = await git.resolveRef({
    fs, dir: workspace, ref: "HEAD"
  })

  let lock = {
    name: "Terasology",
    version: engineInfo.version,
    sha,
    lockfileVersion: 1,
    modules: await moduleLock(workspace),
    libs: await libLock(workspace),
  }

  return lock;
}

module.exports = {
  lockfile,
};