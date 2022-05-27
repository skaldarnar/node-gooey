//@ts-check

const { findRoot, listModules, listLibs } = require("../../helpers/workspace");
const { reset } = require("../../helpers/git");

const chalk = require("chalk");
const asyncPool = require("tiny-async-pool");

module.exports.command = "reset [categories...]";

module.exports.describe = "Reset a workspace element to the latest state of the default upstream branch.";

//TODO: This is basically the same as 'update.js', but with a slightly different handler.
//      Reduce code duplication by making these workspace commands parameterizable in the handler function.

module.exports.builder = (yargs) => {
  return yargs
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
    await _reset(element, workspace, argv);
  }
};

async function _reset(element, workspace, argv) {
  const task = async m => reset(m, argv);
  switch (element) {
    case "root":
      console.log(chalk.bold("workspace"));
      const result = await task(workspace)
      _updateMsg("root", result, "  ");
      break;
    case "modules":
      const modules = await listModules(workspace);
      if (modules.length > 0) {
        console.log(chalk`{bold ${element}}`);
        (await asyncPool(16, modules, task))
         .forEach(result => _updateMsg("module", result, "  "));
      }      
      break;
    case "libs":
      const libs = await listLibs(workspace);
      if (libs.length > 0) {
        console.log(chalk`{bold ${element}}`);
        (await asyncPool(16, libs, task))
          .forEach(result => _updateMsg("lib", result, "  "));
      }
  }
}

function _updateMsg(category, info, indent) {
  //console.debug(JSON.stringify(info, null, 2))
  let msg = indent || "";
  msg += chalk`{dim ${category.padStart(6)}} ${info.name.padEnd(32)}`
  if (info.summary.error) {
    msg += chalk.bold.red(info.before.current)
    msg += "\n" + chalk.italic.red(info.summary.error.message.replace(/^/gm, indent + "  "))
  } else if (_hasChanged(info)) {
    msg += chalk.bold.green(info.after.current.padEnd(24))
    msg += chalk.grey(info.before.ref.substring(0, 8) + "..." + info.after.ref.substring(0, 8));
  } else {
    msg += chalk.cyan(info.after.current)
  }
  console.log(msg);
}

function _hasChanged(info) {
  return info.before.ref != info.after.ref || info.summary.summary.changes > 0;
}