//@ts-check

const chalk = require("chalk");
const ora = require("ora");
const { basename } = require("path");
const asyncPool = require("tiny-async-pool");

const { findRoot, listModules, listLibs } = require("../../src/workspace");
const { status } = require("../../src/git");

module.exports.command = "view [categories...]";

module.exports.describe = "Inspect the workspace or a specific workspace element.";

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
    .help()
};

module.exports.handler = async (argv) => {
  const spinner = ora('analyzing modules').start();

  const workspace = await findRoot(process.cwd());

  spinner.stop();

  if (argv.categories.includes("root")) {
    _rootMsg(workspace, await status(workspace, argv.fetch));
  } else {
    _rootMsg(workspace);
  }
  for (const element of argv.categories) {
    await _view(element, workspace, argv.fetch);
  }
};


async function _view(element, workspace, fetch) {
  const task = async m => await status(m, fetch);
  switch (element) {
    case "root":
      break;
    case "modules":
      console.log(chalk`{bold ${element}}`);
      const modules = await listModules(workspace);
      (await asyncPool(16, modules, task))
        .forEach(result => _statusMsg("module", result, "  "));
      break;
    case "libs":
      console.log(chalk`{bold ${element}}`);
      const libs = await listLibs(workspace);
      (await asyncPool(16, libs, task))
        .forEach(result => _statusMsg("lib", result, "  "));
      break;
  }
}

function _remoteStatusSymbol(ahead, behind) {
  if (ahead && behind) {
      return "±";
  }
  if (ahead && !behind) {
      return "+";
  }
  if (!ahead && behind) {
      return "-";
  }
  return ""
}

function _statusMsg(category, info, indent) {
  let msg = indent || "";
  msg += chalk`{dim ${category.padStart(6)}} ${info.name.padEnd(32)}`;
  msg += chalk`${_remoteStatusSymbol(info.status.ahead, info.status.behind).padStart(2)}`

  if (info.status.isClean()) {
      msg += chalk`{cyan ${info.currentBranch}}`;
  } else {
      msg += chalk`{yellow ${info.currentBranch}}`;
      info.status.files.forEach(f => msg += `\n\t${f.index}${f.working_dir} ${f.path}`);
  }

  console.log(msg);
}

function _rootMsg(workspace, info) {
  let msg = chalk`{dim workspace} {bold ${basename(workspace).padEnd(31)}}`

  if (info) {
    msg += chalk`${_remoteStatusSymbol(info.status.ahead, info.status.behind).padStart(2)}`
    if (info.status.isClean()) {
      msg += chalk`{cyan ${info.currentBranch}}`;
    } else {
      msg += chalk`{yellow ${info.currentBranch}}`;
      info.status.files.forEach(f => msg += `\n\t${f.index}${f.working_dir} ${f.path}`);
    }
  }

  console.log(msg);
}