//@ts-check

const { increment, updateDependency } = require("../src/modules")
const { findRoot, listModules } = require("../src/workspace");
const { status } = require("../src/git");
const chalk = require("chalk")
const ora = require('ora');
const asyncPool = require("tiny-async-pool");

module.exports.command = "module <m>";

module.exports.describe = "Manage a module and its dependencies and dependants.";

const semverLevel = ["major", "minor", "patch", "premajor", "preminor", "prepatch"]

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
          describe: `Increment a version by the specified level. Level can be one of: major, minor, patch, premajor, preminor, prepatch. Default level is 'minor'.`,
          choices: semverLevel,
          default: "minor",
        })
      },
      async (argv) => {
        const workspace = await findRoot(process.cwd());
        const modules = await listModules(workspace);

        const targetModule = modules.find(el => el.endsWith(argv.m));

        const result = await increment(targetModule, argv.level);
        console.log(`Bumping version for '${argv.m}' from ${result.oldVersion} to ${result.newVersion}`);

        const task = async (m) => {
              const info = await updateDependency(m, argv.m, result.newVersion);
              if (info.newVersion) {
                return `\t${info.id.padEnd(24)}: ${info.oldVersion} >>> ${info.newVersion}`;
              }
              return;
        };

        const msgs = await asyncPool(16, modules, task)
        console.log(msgs.filter(el => el).sort().join("\n"))
      }
    )
    .demandCommand()
    .help()
};

module.exports.handler = async (argv) => { };
