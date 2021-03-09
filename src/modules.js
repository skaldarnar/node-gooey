//@ts-check

const fs = require("fs-extra");
const git = require("isomorphic-git");
const http = require("isomorphic-git/http/node")
const { join, basename, relative, resolve } = require("path");
const chalk = require("chalk");
const execa = require("execa")

async function status(dir) {
  const name = basename(dir).padEnd(32);
  const currentBranch = await git.currentBranch({fs, dir});

  const status = await execa("git", ["-C", dir, "status", "--porcelain"]);
  const changedFiles = status.stdout.split("\n");

  const dirty = status.stdout != "";

  let msg = chalk`{dim module} ${name}`;

  if (dirty) {
    msg += chalk`{yellow ${currentBranch}}`;
    changedFiles.forEach(f => msg += `\n\t${f}`);
  } else {
    msg += chalk`{cyan ${currentBranch}}`;
  }
  return msg;
}

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
      .filter(dir => isModule(dir))
      .sort();

  return modules;
}


module.exports = {
  listModules,
  update,
  reset,
  status,
};
