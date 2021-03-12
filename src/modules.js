//@ts-check

const fs = require("fs-extra");
const git = require("isomorphic-git");
const { join, basename } = require("path");
const chalk = require("chalk");
const execa = require("execa");

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

module.exports = {
  reset,
};
