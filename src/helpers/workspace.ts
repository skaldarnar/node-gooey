//@ts-check

const fs = require("fs-extra");
const { getRef } = require("../helpers/git")
const { join, resolve } = require("path");
const chalk = require("chalk");
const execa = require("execa");
const { default: simpleGit } = require("simple-git");

async function findRoot(dir) {
  const git = simpleGit(dir, {binary: 'git'});
  try {
    const root = await git.revparse("--show-toplevel");
    if (isRoot(root)) {
      return root;
    }
    return await findRoot(resolve(root, ".."));
  } catch (err) {
  }
  console.error(chalk.red.bold("Not in a Terasology workspace."))
}

function isRoot(dir) {
  const settings = join(dir, "settings.gradle");
  if (fs.existsSync(settings)) {
    try {
      execa.sync("grep", ["rootProject.name = 'Terasology'", settings]);
      return true;
    } catch (err) {
      return false;
    }
  }
  return false;
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


async function listLibs(workspace) {
  if (!workspace) return [];
  const libs = 
    (await fs.readdir(join(workspace, "libs"), {withFileTypes: true }))
      .filter(dir => dir.isDirectory())
      .filter(dir => fs.existsSync(`${dir}/.git`))
      .map(dir => join(workspace, "libs", dir.name))
      .sort();

  return libs;
}

module.exports = {
  listLibs,
  listModules,
  findRoot,
  isRoot
};
