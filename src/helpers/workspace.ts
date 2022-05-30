import * as fs from "fs-extra";
import { join, resolve } from "path";
import * as chalk from "chalk";
import * as execa from "execa";
import simpleGit from "simple-git";

async function findRoot(dir: string): Promise<string> {
  const git = simpleGit(dir, {binary: 'git'});
  try {
    const root = await git.revparse("--show-toplevel");
    if (await isRoot(root)) {
      return root;
    }
    return await findRoot(resolve(root, ".."));
  } catch (err) {
    throw new Error(chalk.red.bold("Not in a Terasology workspace.", err));
  }  
}

async function isRoot(dir: string) {
  const settings = join(dir, "settings.gradle");
  try {
    const {stdout, stderr} = execa.sync("grep", ["rootProject.name = 'Terasology'", settings]);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Predicate to synchronously check whether a given directory is a module based on the presence of `module.txt`.
 * @param {string} dir path to a directory
 */
 function isModule(dir: string) {
  const moduleInfo = join(dir, "module.txt");
  return fs.pathExistsSync(moduleInfo);
}

async function listModules(workspace: string) {
  if (!workspace) return [];
  const modules = 
    (await fs.readdir(join(workspace, "modules"), {withFileTypes: true }))
      .filter(dir => dir.isDirectory())
      .map(dir => join(workspace, "modules", dir.name))
      .filter(dir => isModule(dir))
      .sort();

  return modules;
}


async function listLibs(workspace: string) {
  if (!workspace) return [];
  const libs = 
    (await fs.readdir(join(workspace, "libs"), {withFileTypes: true }))
      .filter(dir => dir.isDirectory())
      .map(dir => join(workspace, "libs", dir.name))
      .filter(dir => fs.existsSync(join(dir, ".git")))      
      .sort();

  return libs;
}

export {
  listLibs,
  listModules,
  findRoot,
  isRoot
};
