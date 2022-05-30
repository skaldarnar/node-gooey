import {Command, Help} from '@oclif/core'

export default class Module extends Command {
  static description = 'Manage a module and its dependencies and dependants.'

  static examples = []

  static args = []

  async run(): Promise<void> {
    const help = new Help(this.config)
    await help.showHelp(['module'])

    this.warn('Please select a module command to run.')
  }
}
