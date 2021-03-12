//@ts-check

const chalk = require("chalk");

module.exports.command = "update [elements...]";

module.exports.describe = "Update a workspace element";

const elements = ["modules", "libs"]

module.exports.builder = (yargs) => {
  return yargs
    .option(
      "reset",
      {
        description: "Reset to to the default upstream branch (develop)",
        type: "boolean"
      }
    )
    .option(
      "force",
      {
        description: "Dismiss all local changes withut asking.",
        type: "bolean"
      }
    )
    .positional(
      "elements",
      {
        description: "Only update the listed elements (module or lib)",
        type: "array",
        choice: elements
      }
    )
    .help()
};

module.exports.handler = async (argv) => { };
