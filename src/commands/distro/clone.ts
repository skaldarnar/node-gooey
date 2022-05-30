import {Command} from '@oclif/core'
import {cloneDistribution} from '../../helpers/github'

export default class DistroClone extends Command {
  static description =
    'Clone all modules of the given distribution to the local workspace.';

  static examples = [];

  static flags = {};

  static args = [
    {
      name: 'distro',
      description: 'The distribution to clone. Default is \'iota\', the minimal reasonable module set.',
      default: 'iota',
    },
  ];

  public async run(): Promise<void> {
    const {args} = await this.parse(DistroClone)
    await cloneDistribution(args.distro)
  }
}
