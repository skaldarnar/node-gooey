//@ts-check

const chalk = require("chalk");

const { findRoot, listModules, listLibs } = require("../../src/workspace");
const { update } = require("../../src/git");
const asyncPool = require("tiny-async-pool");

module.exports.command = "update [categories...]";

module.exports.describe = "Update a workspace element";

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
    .help()
};

module.exports.handler = async (argv) => {
  const workspace = await findRoot(process.cwd());

  for (const element of argv.categories) {
    await _update(element, workspace, argv);
  }
};

async function _update(element, workspace, argv) {
  const task = async m => update(m, argv);
  switch (element) {
    case "root":
      console.log(chalk.bold("workspace"));
      const result = await task(workspace)
      _updateMsg("root", result, "  ");
      break;
    case "modules":
      console.log(chalk`{bold ${element}}`);
      const modules = await listModules(workspace);
      (await asyncPool(16, modules, task))
        .forEach(result => _updateMsg("module", result, "  "));
      break;
    case "libs":
      console.log(chalk`{bold ${element}}`);
      const libs = await listLibs(workspace);
      (await asyncPool(16, libs, task))
        .forEach(result => _updateMsg("lib", result, "  "));
  }
}

function _updateMsg(category, info, indent) {
  //console.debug(JSON.stringify(info, null, 2))
  let msg = indent || "";
  msg += chalk`{dim ${category.padStart(6)}} ${info.name.padEnd(32)}`
  if (info.summary.error) {
    msg += chalk.bold.red(info.before.current)
    msg += "\n" + chalk.italic.red(info.summary.error.message.replace(/^/gm, indent + "  "))
  } else if (info.summary.summary.changes == 0) {
    msg += chalk.cyan(info.after.current)
  } else {
    msg += chalk.bold.green(info.after.current.padEnd(24))
    msg += chalk.grey(info.before.ref.substring(0, 8) + "..." + info.after.ref.substring(0, 8));
  }
  console.log(msg);
}