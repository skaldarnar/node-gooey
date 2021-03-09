//@ts-check

const { listModules, update, reset, status } = require("../src/modules")
const { findRoot } = require("../src/workspace")
const chalk = require("chalk")
const { basename, join } = require("path")
const fs = require("fs-extra");
const ora = require('ora');
const asyncPool = require("tiny-async-pool");

module.exports.command = "modules";

module.exports.describe = "Handle common operations on local modules.";

module.exports.builder = (yargs) => {
  yargs
    .command(
      "list",
      "list all local modules",
      {
        fetch: {
          type: "boolean",
          describe: chalk`fetch remote state before showing state ({italic git fetch})`,
          default: false,
        }
      },
      async (argv) => {
        const spinner = ora('analyzing modules').start();

        const workspace = await findRoot(process.cwd());
        const modules = await listModules(workspace);

        const msgs = await Promise.all(modules.map(async m => await status(m, argv.fetch)))
        spinner.stop();
        msgs.forEach(msg => console.log(msg));
      }
    )
    .command(
      "update",
      chalk`update all modules ({italic git pull})`,
      yargs => {},
      async (argv) => {
        const spinner = ora('updating modules').start();

        const workspace = await findRoot(process.cwd());
        const modules = await listModules(workspace);

        const task = async (module) => await update(module);
        
        const msgs = await asyncPool(16, modules, task)

        spinner.stop();
        console.log(msgs.join("\n"))
      }
    )
    .command(
      "reset",
      chalk`reset and update all modules ({italic git reset --hard})`,
      (yargs) => {},
      async (argv) => {
        const spinner = ora('resetting modules').start();

        const workspace = await findRoot(process.cwd());
        const modules = await listModules(workspace);

        const task = async (m) => {
          let resetMsg = await reset(m);
          let updateMsg= await update(m)
          return resetMsg + "\n" + updateMsg;
        };

        const msgs = await asyncPool(16, modules, task)

        spinner.stop();
        console.log(msgs.join("\n"))
      }
    )
    .demandCommand()
    .help()
};

module.exports.handler = async (argv) => {};
