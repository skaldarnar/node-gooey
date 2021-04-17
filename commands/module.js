//@ts-check

const { update, reset } = require("../src/modules")
const { findRoot, listModules } = require("../src/workspace");
const { status } = require("../src/git");
const chalk = require("chalk")
const ora = require('ora');
const asyncPool = require("tiny-async-pool");

module.exports.command = "module <m>";

module.exports.describe = "Manage a module and its dependencies and dependants.";

const semverLevel = ["major", "minor", "patch", "premajor", "preminor", "prepatch", "prerelease"]

module.exports.builder = (yargs) => {
  yargs
    .positional("m", {
      describe: "the module to manage"
    })
    .command(
      "bump <m>",
      chalk`set the version for a specific module, and update all references ({italic module.txt})`,
      (yargs) => { 
        yargs.option("level", {
          describe: `Increment a version by the specified level. Level can be one of: major, minor, patch, premajor, preminor, prepatch, or prerelease. Default level is 'minor'.`,
          choices: semverLevel,
          default: "minor",
        })
      },
      async (argv) => {
        // const spinner = ora('resetting modules').start();

        // const workspace = await findRoot(process.cwd());
        // const modules = await listModules(workspace);

        // const task = async (m) => {
        //   let resetMsg = await reset(m);
        //   let updateMsg = await update(m)
        //   return resetMsg + "\n" + updateMsg;
        // };

        // const msgs = await asyncPool(16, modules, task)

        // spinner.stop();
        console.log(`Bumping version for '${argv.m}'`);
      }
    )
    .demandCommand()
    .help()
};

module.exports.handler = async (argv) => { };
