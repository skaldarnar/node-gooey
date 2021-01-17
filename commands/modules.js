//@ts-check

const { listModules, update, reset, lockfile } = require("../src/modules")
const { findRoot } = require("../src/workspace")
const { processInChunks } = require("../src/scheduler")
const chalk = require("chalk")
const { basename, join } = require("path")
const fs = require("fs-extra");

module.exports.command = "modules";

module.exports.describe = "Handle common operations on local modules.";

module.exports.builder = (yargs) => {
  yargs
    .command(
      "list",
      "list all local modules",
      (yargs) => {},
      async (argv) => {
        const workspace = await findRoot(process.cwd());
        const modules = await listModules(workspace);
        modules.forEach(m => console.log(chalk`{dim module} ${basename(m)}`));
      }
    )
    .command(
      "lock",
      "write a lock-file to pin module versions (commits)",
      (yargs) => {},
      async (argv) => {
        const workspace = await findRoot(process.cwd());
        const lock = await lockfile(workspace);
        await fs.writeJSON(join(workspace, "workspace-lock.json"), lock, {spaces: 2});
      }
    )
    .command(
      "update",
      chalk`update all modules ({italic git pull})`,
      (yargs) => {},
      async (argv) => {
        const workspace = await findRoot(process.cwd());
        const modules = await listModules(workspace);

        processInChunks(
          modules.map(m => async () => update(m).then(console.log)),
          { chunkSize: 10}
        );
      }
    )
    .command(
      "reset",
      chalk`reset and update all modules ({italic git reset --hard})`,
      (yargs) => {},
      async (argv) => {
        const workspace = await findRoot(process.cwd());
        const modules = await listModules(workspace);

        processInChunks(
          modules.map(m => async () => {
            let resetMsg = await reset(m);
            let updateMsg= await update(m)
            console.log(resetMsg + "\n" + updateMsg)
          }),
          { chunkSize: 10}
        );
      }
    )
    .demandCommand()
    .help()
};

module.exports.handler = async (argv) => {};
