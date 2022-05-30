import {Command, Help} from '@oclif/core'

export default class Distro extends Command {
  static description = 'View and clone different module distributions.'

  static examples = []

  static flags = {}

  static args = []

  public async run(): Promise<void> {
    this.warn("Please select a distro command to run.")

    const help = new Help(this.config)
    await help.showHelp(["distro"]);
  }
}
