//@ts-check

const chalk = require("chalk");

module.exports.command = "workspace";

module.exports.describe = "Manage a Terasology workspace";

module.exports.builder = (yargs) => {
  return yargs
    .commandDir("./workspace_cmds")
    .demandCommand()
    .help()
};

module.exports.handler = async (argv) => {};
