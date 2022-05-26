//@ts-check

const chalk = require("chalk");
const { listModules } = require("./workspace");
const fs = require("fs-extra");
const { join, resolve, relative } = require("path");
const { getRef } = require("./git");
/** @type {import("simple-git").SimpleGitFactory} */
const SimpleGit = require("simple-git");

/**
 * @typedef {Object} Options
 * @property {boolean} exact - resolve commit SHA instead of symbolic reference
 */

/**
 * 
 * @param {string} workspace 
 * @param {Options} options 
 */
async function moduleLock(workspace, options) {
  const modules = await listModules(workspace);
  const entries = await Promise.all(modules.map(async dir => {
    const git = SimpleGit({binary: 'git', baseDir: dir});
    const ref = await getRef(git, options.exact);
    const moduleInfo = JSON.parse(fs.readFileSync(resolve(dir, "module.txt"), 'utf8'));

    return {
      name: moduleInfo.id,
      version: moduleInfo.version,
      dir: relative(workspace, dir),
      ref
    }
  }));

  let result = {}

  for (const m of entries) {
    result[m.dir] = {
      name: m.name,
      version: m.version,
      ref: m.ref
    }
  }
  return result;
}

/**
 * 
 * @param {string} workspace 
 * @param {Options} options 
 */
async function libLock(workspace, options) {
  console.log(chalk.yellow("Pinning libraries is not supported yet"));
  return {};
}

/**
 * 
 * @param {string} workspace 
 * @param {Options} options 
 */
async function lockfile(workspace, options) {
  const git = SimpleGit({baseDir: workspace, binary: 'git'});
  const engineInfo = JSON.parse(fs.readFileSync(join(workspace, "engine/src/main/resources/org/terasology/engine/module.txt"), "utf-8"));
  const ref = await getRef(git, options.exact);

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

module.exports = {
  lockfile,
};