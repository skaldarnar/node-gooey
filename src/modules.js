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

async function getModuleInfo(dir) {
  const branch = await git.currentBranch({fs, dir});
  const info = JSON.parse(fs.readFileSync(resolve(dir, "module.txt"), 'utf8'));
  return {
    dir, 
    info,
    branch
  }
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


module.exports = {
  getModuleInfo,
  listModules,
  reset,
  update,
};
