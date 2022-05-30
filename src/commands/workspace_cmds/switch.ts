//@ts-check
const { findRoot, listModules, listLibs } = require("../../helpers/workspace");
const { checkout } = require("../../helpers/git");

const chalk = require("chalk");
const asyncPool = require("tiny-async-pool");

module.exports.command = "switch <branch> [categories...]";

module.exports.describe = "Switch branches on workspace elements.";

module.exports.builder = (yargs) => {
  return yargs
    .option(
      "force",
      {
        description: "Discard all local changes withut asking.",
        type: "bolean"
      }
    )
    .option(
      "isPresent",
      {
        description: "Only switch branch if it exists locally or on remote.",
        type: "bolean",
        default: true
      }
    )
    .option(
      "fetch",
      {
        type: "boolean",
        describe: chalk`fetch remote state before showing state ({italic git fetch})`,
        default: false,
      }
    )
    .positional("branch", {
      describe: `the branch name to check out.`,
    })
    .help()
};

module.exports.handler = async (argv) => {
  const workspace = await findRoot(process.cwd());

  for (const element of argv.categories) {
    await _switch(element, workspace, argv);
  }
};


async function _switch(element, workspace, argv) {
  const task = async m => checkout(m, argv);

  switch (element) {
    case "root":
      console.log(chalk.bold("workspace"));
      const result = await task(workspace)
      _statusMsg("root", result, "  ", argv);
      break;
    case "modules":
      const modules = await listModules(workspace);
      if (modules.length > 0) {
        console.log(chalk`{bold ${element}}`);
        (await asyncPool(16, modules, task))
          .forEach(result => _statusMsg("module", result, "  ", argv));
      }
      break;
    case "libs":
      const libs = await listLibs(workspace);
      if (libs.length > 0) {
        console.log(chalk`{bold ${element}}`);
        (await asyncPool(16, libs, task))
          .forEach(result => _statusMsg("lib", result, "  ", argv));
      }
  }
}

function _statusMsg(category, info, indent, argv) {
  //console.debug(JSON.stringify(info, null, 2))

  let msg = indent || "";
  msg += chalk`{dim ${category.padStart(6)}} ${info.name.padEnd(32)}`;


  if (info.summary.error) {
    if (argv.isPresent && info.summary.error.message.startsWith("fatal: invalid reference:")) {
      msg += chalk.grey(info.after.current);
    } else {
      msg += chalk.red(info.after.current);
      info.summary.error.message.split("\n").forEach(f => msg += chalk.red.italic`\n\t${f}`);
    }
  } else if (_hasChanged(info)) {
    msg += chalk.bold.green(info.after.current.padEnd(24));
    msg += chalk.grey(`${info.before.current.padStart(16)} ⇒ ${info.after.current}`);
  } else {
    msg += chalk`{cyan ${info.after.current.padEnd(24)}}`;
  }
  console.log(msg);
}

function _hasChanged(info) {
  return info.before.current != info.after.current;
}