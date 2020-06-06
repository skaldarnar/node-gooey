#!/usr/bin/env node

const gooey = require("./lib");

require("yargs")
  .command(
    "distro",
    "list available distributions",
    (yargs) => {},
    async (argv) => {
      const distros = await gooey.availableDistributions();
      console.log(distros);
    }
  )
  .command(
    "clone [distro]",
    "clone all modules of the given distribution",
    (yargs) => {
      yargs.positional("distro", {
        describe: "distribution to clone",
        default: "iota",
      });
    },
    (argv) => {
      gooey.cloneDistribution(argv.distro);
    }
  )
  .commandDir("./commands")
  .option("help", {
    alias: "h",
    description: "Show this help message an exit"
  })
  .demandCommand()
  .help().argv;
