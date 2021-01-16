//@ts-check

const fs = require("fs-extra");
const git = require("isomorphic-git");
const http = require("isomorphic-git/http/node")
const { join, basename, relative, resolve } = require("path");
const chalk = require("chalk");

const { processInChunks } = require("./scheduler")

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

/**
 *
 * @param {string} dir
 */
async function update(dir) {
  const name = basename(dir).padEnd(32);
  const branch = `[${await git.currentBranch({fs, dir})}]`.padStart(16);

  let msg = chalk`{dim module} ${name} ${branch}: `
  try {
    await git.fastForward({
      fs,
      http,
      dir,
      corsProxy: 'https://cors.isomorphic-git.org',
    });
    msg += chalk.green("up to date")
  } catch (err) {
    msg += chalk.red.bold(err.message);
  }  
  return msg;
}

/**
 * Predicate to synchronously check whether a given directory is a module based on the presence of `module.txt`.
 * @param {string} dir path to a directory
 */
function isModule(dir) {
  const moduleInfo = join(dir, "module.txt");
  return fs.pathExistsSync(moduleInfo);
}

async function listModules(workspace) {
  if (!workspace) return [];
  const modules = 
    (await fs.readdir(join(workspace, "modules"), {withFileTypes: true }))
      .filter(dir => dir.isDirectory())
      .map(dir => join(workspace, "modules", dir.name))
      .filter(dir => isModule(dir));

  return modules;
}


async function lockfile(workspace) {
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

  const engineInfo = JSON.parse(fs.readFileSync(join(workspace, "engine/src/main/resources/engine-module.txt"), "utf-8"));
  const sha = await git.resolveRef({
    fs, dir: workspace, ref: "HEAD"
  })

  let lock = {
    name: "Terasology",
    version: engineInfo.version,
    sha,
    lockfileVersion: 1,
    modules: { }
  }

  for (const m of entries) {
    lock.modules[m.dir] = {
      name: m.name,
      version: m.version,
      sha: m.sha
    }
  }

  return lock;
}

module.exports = {
  listModules,
  update,
  reset,
  lockfile,
};
