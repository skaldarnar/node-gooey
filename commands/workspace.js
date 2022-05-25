//@ts-check

const chalk = require("chalk");

const categories = ["root", "libs", "modules"]

module.exports.command = "workspace";

module.exports.describe = "Manage a Terasology workspace";

module.exports.builder = (yargs) => {
  return yargs
    .commandDir("./workspace_cmds")
    .positional("categories", {
      describe: `the categories of sub-repositories to work on. (default ${chalk.italic("all")})`,
      choices: categories,
      default: categories,
    })
    .demandCommand()
    .help()
};

module.exports.handler = async (argv) => { };
