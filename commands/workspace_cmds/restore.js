//@ts-check

const chalk = require("chalk");
const { findRoot } = require("../../src/workspace");
const fs = require("fs-extra");
const { join, basename } = require("path");
const git = require("isomorphic-git");
const asyncPool = require("tiny-async-pool");
const ora = require('ora');

module.exports.command = "restore";

module.exports.describe = chalk`Restore a workspace from a {italic workspace-lock.json} lockfile`;

module.exports.builder = (yargs) => {
  return yargs
    .option("lockfile", {
      description: "the lockfile for pinning/restoring a workspace",
      type: "string",
      demandOption: false,
    })
    .option(
      "force", {
      description: "Dismiss all local changes withut asking.",
      type: "bolean"
    })
};

async function checkout(dir, ref, options) {
  if (!fs.pathExistsSync(dir)) {
    return chalk`{dim restore module} ${basename(dir).padEnd(32)} {yellow skipped} {dim (path does not exist: ${dir})}`
    return;
  }

  const current = await git.currentBranch({fs, dir});
  const sha = await git.resolveRef({fs, dir, ref: "HEAD"});
  await git.checkout({fs, dir, ref, force: options.force});

  return chalk`{dim restore module} ${basename(dir).padEnd(32)}@{green ${ref.padEnd(32)}} {dim (was ${current}@${sha})}`
}

module.exports.handler = async (argv) => {
  const spinner = ora('restoring workspace').start();

  const root = await findRoot(process.cwd());
  const src = argv.lockfile || join(root, "workspace-lock.json");

  const lock = await fs.readJSON(src);

  if (lock.lockfileVersion === 1) {
    await checkout(root, lock.ref, { force: argv.force});

    const modules = Object.entries(lock.modules).map(([modulePath, moduleInfo]) => {
      return {
        dir: join(root, modulePath),
        ref: moduleInfo.ref,
        options: { force: argv.force},
      }
    })

    const task = async ({dir, ref, options}) => await checkout(dir, ref, options);

    const msgs = await asyncPool(1, modules, task);

    spinner.succeed("Done!");
    console.log(msgs.join("\n"));
  } 
};
