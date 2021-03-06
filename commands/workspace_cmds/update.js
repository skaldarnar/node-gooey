//@ts-check

const chalk = require("chalk");
const { basename } = require("path");

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

  if (argv.categories.includes("root")) {
    _rootMsg(workspace, await update(workspace));
  } else {
    _rootMsg(workspace);
  }

  for (const element of argv.categories) {
    await _update(element, workspace);
  }
};


async function _update(element, workspace) {
  const task = async m => await update(m);
  switch (element) {
    case "root":
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

function _updateMsg(category, result, indent) {
  //console.debug(JSON.stringify(result, null, 2));

  let msg = indent || "";
  msg += chalk`{dim ${category.padStart(6)}} ${result.name.padEnd(32)}`

  if (result.summary.error) {
    msg += chalk.red(result.after.current)
  } else if (result.summary.summary.changes == 0) {
    msg += chalk.cyan(result.after.current)
  } else {
    msg += chalk.bold.green(result.after.current.padEnd(24))
    msg += chalk.grey(result.before.ref.substring(0, 8) + "..." + result.after.ref.substring(0, 8));
  }

  console.log(msg);
}

function _rootMsg(workspace, info) {
  let msg = chalk`{dim workspace} {bold ${basename(workspace).padEnd(31)}}`

  if (info) {
    if (info.summary.summary.changes == 0) {
      msg += chalk.cyan(info.after.current)
    } else {
      msg += chalk.bold.green(info.after.current.padEnd(24))
      msg += chalk.grey(info.before.ref.substring(0, 8) + "..." + info.after.ref.substring(0, 8));
    }
  }

  console.log(msg);
}