//@ts-check

const chalk = require("chalk");
const { lockfile } = require("../../src/lockfile");
const { findRoot } = require("../../src/workspace");
const fs = require("fs-extra");
const { join, basename } = require("path");
const git = require("isomorphic-git");
const http = require("isomorphic-git/http/node")
const { processInChunks } = require("../../src/scheduler");
const { options } = require("yargs");

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
  const current = await git.currentBranch({ fs, dir });
  const sha = await git.resolveRef({ fs, dir, ref: "HEAD" });
  console.log(chalk`{dim restore module} ${basename(dir)}@{green ${ref.substring(0, 8)}} {dim (was ${current}@${sha.substring(0, 8)})}`);
  
  try {
    await git.fetch({ fs, http, dir, corsProxy: 'https://cors.isomorphic-git.org' });
    //TODO: strip off `refs/heads`
    await git.checkout({ fs, dir, ref, force: options.force });
  } catch (err) {
    console.error(err)
  }
}

module.exports.handler = async (argv) => {
  const root = await findRoot(process.cwd());
  const src = argv.lockfile || join(root, "workspace-lock.json");

  const lock = await fs.readJSON(src);

  if (lock.lockfileVersion === 1) {
    await checkout(root, lock.ref, { force: argv.force });

    const tasks = Object.entries(lock.modules).map(([modulePath, moduleInfo]) => {
      return async () => checkout(join(root, modulePath), moduleInfo.ref, { force: argv.force })
    })

    await processInChunks(tasks, { chunkSize: 10 })
  }
};
