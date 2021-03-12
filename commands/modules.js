//@ts-check

const { update, reset } = require("../src/modules")
const { findRoot, listModules } = require("../src/workspace");
const { status } = require("../src/git");
const chalk = require("chalk")
const ora = require('ora');
const asyncPool = require("tiny-async-pool");

module.exports.command = "modules";

module.exports.describe = "Handle common operations on local modules.";

module.exports.builder = (yargs) => {
  yargs
    .command(
      "reset",
      chalk`reset and update all modules ({italic git reset --hard})`,
      (yargs) => { },
      async (argv) => {
        const spinner = ora('resetting modules').start();

        const workspace = await findRoot(process.cwd());
        const modules = await listModules(workspace);

        const task = async (m) => {
          let resetMsg = await reset(m);
          let updateMsg = await update(m)
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

module.exports.handler = async (argv) => { };
