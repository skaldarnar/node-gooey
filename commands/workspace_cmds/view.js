//@ts-check

const chalk = require("chalk");
const ora = require("ora");
const { findRoot, listModules, listLibs } = require("../../src/workspace");
const { status } = require("../../src/git");

module.exports.command = "view [categories...]";

module.exports.describe = "Inspect the workspace or a specific workspace element.";

const categories = ["modules", "libs"]

module.exports.builder = (yargs) => {
  return yargs
    .option(
      "fetch",
      {
        type: "boolean",
        describe: chalk`fetch remote state before showing state ({italic git fetch})`,
        default: false,
      }
    )
    .positional(
      "categories", {
        describe: "the category of sub-repositories to work on.",
        choices: categories,
        default: categories,
    }
    )
    .help()
};

module.exports.handler = async (argv) => {
  const spinner = ora('analyzing modules').start();

  const workspace = await findRoot(process.cwd());

  spinner.stop();

  console.log(chalk`{dim workspace} ${workspace}`);
  for (const element of argv.elements) {
    console.log(chalk`{bold ${element}}`);
    await _view(element, workspace, argv.fetch);
  }
};


async function _view(element, workspace, fetch) {
  let msgs;
  switch (element) {
    case "modules":
      const modules = await listModules(workspace);
      msgs = await Promise.all(modules.map(async m => await status(m, fetch)))
      msgs.forEach(msg => console.log("  " + msg));
      break;
    case "libs":
      const libs = await listLibs(workspace);
      msgs = await Promise.all(libs.map(async m => await status(m, fetch)))
      msgs.forEach(msg => console.log("  " + msg));
      break;
  }
}