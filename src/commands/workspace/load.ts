import { CliUx, Command, Flags } from "@oclif/core";
import chalk = require("chalk");
import { readJSON } from "fs-extra";
import { basename, join, resolve } from "path";
import Debug from "debug";
import asyncPool = require("tiny-async-pool");

import { findRoot } from "../../helpers/workspace";
import { checkout, CheckoutOptions, CheckoutResult, StatusResult } from "../../helpers/git";

type WorkspaceLoadOptions = {
  force: boolean;
};

export default class WorkspaceLoad extends Command {
  static description = `Load a workspace from a JSON lockfile.`;

  static examples = [
    "gooey-cli workspace:load",
    "gooey-cli workspace:load --lockfile terasology.lock --force",
  ];

  static flags = {
    lockfile: Flags.string({
      char: "i",
      description: chalk`The lockfile to restore the workspace from. {italic (default: <root>/workspace-lock.json)}`,
    }),
    force: Flags.boolean({
      char: "f",
      description: "Discard all local changes without asking.",
    }),
  };

  static args = [];

  public async run(): Promise<void> {
    const debug = Debug("workspace:load");
    const { args, flags } = await this.parse(WorkspaceLoad);

    const root = await findRoot(process.cwd());
    const src = flags.lockfile ?? join(root, "workspace-lock.json");

    CliUx.ux.action.start(
      `Reading lockfile from file:${resolve(process.cwd(), src)}`
    );
    const lock = await readJSON(src);
    CliUx.ux.action.stop();

    debug(JSON.stringify(lock, null, 2));

    // Restore Engine (root)
    this.log(chalk.bold("Engine"));
    let res = await checkout(root, {
      force: flags.force,
      fetch: true,
      branch: lock.ref,
    });
    debug(JSON.stringify(res, null, 2));
    this.log(this.msg("engine", res));

    // Restore Libs (libs/*)
    const libs = Object.entries(lock.libs).map(
      ([libPath, libInfo]) => {
        return {
          dir: join(root, libPath),
          //@ts-ignore
          options: { branch: libInfo.ref, force: flags.force },
        };
      }
    );

    const task = async (repo: { dir: string; options: CheckoutOptions }) =>
        await checkout(repo.dir, repo.options);

    if (libs.length > 0) {
      this.log(chalk.bold("Libs"));
      for await (const m of asyncPool(8, libs, task)) {
        this.log(this.msg("libs", m));
      }
    }

    // Restore Modules (modules/*)
    const modules = Object.entries(lock.modules).map(
      ([modulePath, moduleInfo]) => {
        return {
          dir: join(root, modulePath),
          //@ts-ignore
          options: { branch: moduleInfo.ref, force: flags.force },
        };
      }
    );

    if (modules.length > 0) {
      this.log(chalk.bold("Modules"));
      for await (const m of asyncPool(8, modules, task)) {
        this.log(this.msg("module", m));
      }
    }
  }

  msg(category: string, result: CheckoutResult) {
    const entry = chalk.dim(category.padStart(8)) + " " + result.name.padEnd(32);

    const ref = (status: StatusResult) => `${status.current}@${status.ref.substring(0,8)}`;

    if (result.before.ref === result.after.ref) {
      return entry +  "skipped";
    } else {
      return entry + chalk`{dim ${ref(result.before)}} ⇢ {bold.green ${ref(result.after)}}`;
    }
  }
}
