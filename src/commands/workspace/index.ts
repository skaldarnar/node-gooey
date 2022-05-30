import {Command, Help} from '@oclif/core'
import * as chalk from "chalk"

export default class Workspace extends Command {
  static description = 'Manage a Terasology workspace.'

  static examples = [
    `$ gooey-cli workspace:status`,
  ]

  static categories = ["root", "libs", "modules"]
  static args = [
    {
      name: 'categories',
      description: chalk`the categories of sub-repositories to work on. (default {italic all})`,
      default: this.categories,
      options: this.categories,
    }
  ]

  async run(): Promise<void> {
    this.warn("Please select a workspace command to run.")

    const help = new Help(this.config)
    await help.showHelp(["workspace"]);
  }
}
