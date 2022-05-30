import {Command, Flags} from '@oclif/core'
import chalk = require('chalk');
import {basename, relative, resolve} from 'node:path'
import semver = require('semver');
import simpleGit, {CommitResult} from 'simple-git'

import {ModuleInfo, readModuleInfo, writeModuleInfo} from '../../helpers/io'
import {findRoot, listModules} from '../../helpers/workspace'

export default class Release extends Command {
  static summary = 'Prepare and tag a module release.';

  static description = `
    This is an automation for the module release process as described in 
    \thttps://github.com/MovingBlocks/Terasology/wiki/Release%3A-Modules`;

  static examples = [
    `$ gooey-cli module:release --tag --scope major Health
    Prepare a new major release for the 'Health' module and tag it.`,
    `$ gooey-cli module:release --scope minor
    Prepapre a minor release without tag for the module this command is run from.`,
  ];

  /** Semver scopes for release version increments. */
  static scopes = ['major', 'premajor', 'minor'];

  static flags = {
    tag: Flags.boolean({
      char: 't',
      description: 'Create an annotated tag for the release.',
    }),
    scope: Flags.string({
      char: 's',
      description: 'Semver scope to make the release for.',
      options: this.scopes,
      default: 'minor',
    }),
    // TODO: add dry-run option
    // "dry-run": Flags.boolean({
    //   char: "n",
    //   description: "Perform a dry run without any changes made.",
    // }),
  };

  static args = [
    {
      name: 'module',
      description: 'The module to prepare a release for.',
    },
  ];

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Release)

    const workspace = await findRoot(process.cwd())
    const modules = await listModules(workspace)

    const target = args.module ?? basename(process.cwd())
    const targetModule = modules.find(el => el.endsWith(target))

    if (!targetModule) {
      this.error(`Unknown module: ${target}`)
    }

    const moduleDir = resolve(workspace, targetModule)
    const moduleInfo = await readModuleInfo(moduleDir)

    const currentVersion = moduleInfo.version
    // @ts-ignore (only valid semver.ReleaseType allowed as '--scope' options)
    const releaseVersion = semver.inc(currentVersion, flags.scope)

    if (!releaseVersion) {
      this.error(`Could not increment module version '${currentVersion}' by '${flags.scope}' scope.`)
    }

    moduleInfo.version = releaseVersion
    const commitInfo = await this.writeAndCommit(
      moduleDir,
      moduleInfo,
      `release: version ${releaseVersion}`,
    )

    let tag
    if (flags.tag) {
      tag = await this.createReleaseTag(moduleDir, {version: releaseVersion, sha: commitInfo.commit})
    }

    const nextVersion = this.nextSnapshot(releaseVersion)

    if (nextVersion === null) {
      this.error('Could not increment to next snapshot version.')
    }

    moduleInfo.version = nextVersion
    await this.writeAndCommit(
      moduleDir,
      moduleInfo,
      `chore: prepare snapshot builds for ${nextVersion}`,
    )

    this.log(chalk`Release {bold ${target} @ ${releaseVersion}} {dim (now ${nextVersion})}`)
    this.log('commit: '.padStart(12) + commitInfo.commit)
    if (tag) {
      this.log('tag: '.padStart(12) + tag.name)
    }

    this.log()
    if (tag) {
      this.log("To push the release commit, the tag and the increment to next snapshot version to 'origin' run:")
    } else {
      this.log("To push the release commit and the increment to next snapshot version to 'origin' run:")
    }

    this.log(`  git push origin ${commitInfo.commit}:develop`)
    if (tag) {
      this.log(`  git push origin v${releaseVersion}`)
    }

    this.log('  git push origin develop')
  }

  /**
   * Increments the given version to the next patch-level snapshot prerelease.
   *
   * For instance, this increments `1.2.3` to `1.3.0-SNAPSHOT`.
   *
   * @param version the current (release) version to increment to next snapshot
   */
  nextSnapshot(version: string): string | null {
    return semver.inc(version, 'minor') + '-SNAPSHOT'
  }

  /**
   * Writes the given object to `module.txt` and commits the change stating the message.
   *
   * @param moduleInfo the content of `module.txt` to write
   * @param message the commit message
   */
  async writeAndCommit(
    moduleDir: string,
    moduleInfo: ModuleInfo,
    message: string,
  ): Promise<CommitResult> {
    const git = simpleGit(moduleDir, {binary: 'git'})

    const moduleInfoFile = await writeModuleInfo(moduleDir, moduleInfo)

    await git.add(relative(moduleDir, moduleInfoFile))

    return git.commit(message)
  }

  /**
   * Create an annotated tag for the release commit.
   *
   * @param release.version the release version (valid semver)
   * @param release.sha the SHA of the release commit to annotate
   */
  async createReleaseTag(
    moduleDir: string,
    release: { version: string; sha: string },
  ): Promise<{name: string}> {
    const git = simpleGit(moduleDir, {binary: 'git'})
    return git.addAnnotatedTag(
      'v' + release.version,
      `Release ${release.version}`,
    )
  }
}
