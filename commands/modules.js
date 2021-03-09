//@ts-check

const { listModules, update, reset, status } = require("../src/modules")
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
        const modules = (await listModules(workspace)).sort();

        const msgs = await Promise.all(modules.map(async m => await status(m)))
        msgs.forEach(msg => console.log(msg));
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
