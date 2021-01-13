//@ts-check

const fs = require("fs-extra");
const git = require("isomorphic-git");
const { join, resolve } = require("path");
const chalk = require("chalk");
const execa = require("execa")

async function findRoot(dir) {
  try {
    const root = await git.findRoot({fs, filepath: dir });
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
      console.error(err)
      return false;
    }
  }
  return false;
}

module.exports = {
  findRoot,
  isRoot
};
