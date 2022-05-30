//@ts-check

const { findRoot } = require("../../helpers/workspace");
const { checkout: checkoutBranch } = require("../../helpers/git");

const chalk = require("chalk");
const fs = require("fs-extra");
const { join, basename } = require("path");
const asyncPool = require("tiny-async-pool");
const ora = require('ora');
const { Stream } = require("stream");

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
  }

  const result = await checkoutBranch(dir, {fetch: true, branch: ref, force: options.force});

  return chalk`{dim restore module} ${basename(dir).padEnd(32)}@{green ${ref.padEnd(32)}} {dim (was ${result.before.current}@${result.before.ref.substring(0, 8)})}`
}

module.exports.handler = async (argv) => {
  const spinner = ora('restoring workspace').start();

  const root = await findRoot(process.cwd());
  const src = argv.lockfile || join(root, "workspace-lock.json");

  const lock = await fs.readJSON(src);

  //console.debug(JSON.stringify(lock, null, 2));

  const rootMsg = await checkout(root, lock.ref, { force: argv.force});
  spinner.succeed(rootMsg);

  const modules = Object.entries(lock.modules).map(([modulePath, moduleInfo]) => {
    return {
      dir: join(root, modulePath),
      ref: moduleInfo.ref,
      options: { force: argv.force},
    }
  });

  //console.debug(JSON.stringify(modules, null, 2));

  const task = async ({dir, ref, options}) => {
    const s = ora().start();
    const result = await checkout(dir, ref, options);
    s.succeed(result);
    return result;
  }

  await asyncPool(8, modules, task);
  
  spinner.succeed("Done!");
};
