//@ts-check

const semver = require("semver");
const path = require("path")

const simpleGit = require('simple-git');
const git = simpleGit();

const io = require("../src/io");

module.exports.command = "release";

module.exports.describe = "Prepare and tag a module release.";

module.exports.builder = (yargs) => {
  yargs
    .option("scope", {
      alias: "s",
      choices: [
        "major",
        "premajor",
        "minor"
      ],
      default: "minor",
    })
    .option("tag", {
      alias: "t",
      type: "boolean",
      describe: "create an annotated tag for the release",
      default: false,
    })
    .help();
};

module.exports.handler = async (argv) => {
  const moduleInfo = await io.readModuleInfo(process.cwd());

  const currentVersion = moduleInfo.version;

  const releaseVersion = semver.inc(currentVersion, argv.scope);
  moduleInfo.version = releaseVersion;
  const commitInfo = await writeAndCommit(moduleInfo, `Release version ${releaseVersion}`);

  if (argv.tag) {
    createReleaseTag({ version: releaseVersion, sha: commitInfo.commit });
  }

  const nextVersion = nextSnapshot(releaseVersion);
  moduleInfo.version = nextVersion;
  await writeAndCommit(moduleInfo, `Prepare new SNAPSHOT version ${nextVersion}`);

  console.log(
    `Successfully prepared release for ${releaseVersion} (${commitInfo.commit}) and bumped version to ${nextVersion}.`
  );
};

/**
 * Increments the given version to the next patch-level snapshot prerelease.
 * 
 * For instance, this increments `1.2.3` to `1.3.0-SNAPSHOT`.
 * 
 * @param {string} version the current (release) version to increment to next snapshot
 */
function nextSnapshot(version) {
  return semver.inc(version, "minor") + "-SNAPSHOT";
}

/**
 * Writes the given object to `module.txt` and commits the change stating the message.
 * 
 * @param {object} moduleInfo the content of `module.txt` to write
 * @param {string} message the commit message
 */
async function writeAndCommit(moduleInfo, message) {
  const moduleInfoFile = await io.writeModuleInfo(process.cwd(), moduleInfo);
  git.cwd(process.cwd());
  await git.add(path.relative(process.cwd(), moduleInfoFile));
  return await git.commit(message);
}

/**
 * Create an annotated tag for the release commit.
 * 
 * @param {string} release.version the release version (valid semver)
 * @param {string} release.sha the SHA of the release commit to annotate
 */
async function createReleaseTag(release) {
  git.cwd(process.cwd());
  await git.addAnnotatedTag("v"+release.version, `Release ${release.version}`);
}
