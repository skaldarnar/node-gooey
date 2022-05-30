import {Command, Flags} from '@oclif/core'
import chalk = require('chalk');
import { availableDistributions } from '../../helpers/github';

export default class DistroList extends Command {
  static summary = 'List available module distribution sets.'

  public async run(): Promise<void> {
    this.log(chalk`{bold Terasology Source Distributions} {dim (https://github.com/Terasology/Index/tree/master/distros)}`)
    for (const distro of await availableDistributions()){
      this.log(`  - ${distro}`);
    }
    this.log();
    this.log("To initialize your workspace with a source distribution, run:");
    this.log(chalk.dim`  $ gooey clone {italic [distro]}`);
  }
}
