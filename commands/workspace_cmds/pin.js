//@ts-check

const chalk = require("chalk");
const { lockfile } = require("../../src/lockfile");
const { findRoot } = require("../../src/workspace");
const fs = require("fs-extra");
const {join, relative} = require("path");

module.exports.command = "pin";

module.exports.describe = chalk`Write a lock-file to pin module versions ({italic workspace-lock.json})`;

module.exports.builder = (yargs) => {
  return yargs
    .option("lockfile", {
      description: "the lockfile for pinning/restoring a workspace",
      type: "string"
    })
    .option("branch", {
      description: "pin the branch instead of the commit SHA",
      type: "boolean"
    })
};

module.exports.handler = async (argv) => {
  const root = await findRoot(process.cwd());
  const lock = await lockfile(root, {pinBranch: argv.branch});

  const dest = argv.lockfile || join(root, "workspace-lock.json");
  console.log(chalk`{dim writing lock file to }${relative(process.cwd(), dest)}`);
  await fs.writeJSON(dest, lock, {spaces: 2});
};
