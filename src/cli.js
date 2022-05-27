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
  .command(
    "topics <org> [topics..]",
    "add given topics to all repositories of the org",
    (yargs) => {
      yargs
        .positional("org", {
          type: "string",
          describe: "the owner (GitHub user or org)",
        })
        .positional("topics", {
          type: "array",
          describe: "the topics to add"
        });
    },
    async (argv) => {
      await gooey.addTopics(argv.org, argv.topics);
    }
  )
  .commandDir("./commands")
  .demandCommand()
  .option("help", {
    alias: "h",
    description: "Show this help message an exit"
  })
  .help().argv;
