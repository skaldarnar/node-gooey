const git = require("isomorphic-git");
const fs = require("fs-extra");
const semver = require("semver");

module.exports.command = "release";

module.exports.describe = "Prepare and push a module release.";

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
    .option("push", {
      alias: "p",
      type: "boolean",
      describe: "push the release commits",
      default: false,
    })
    .help();
};

const MODULE = "module.txt";

module.exports.handler = async (argv) => {
  const moduleInfo = await fs.readJSON(MODULE);

  const currentVersion = moduleInfo.version;

  const releaseVersion = semver.inc(currentVersion, argv.scope);
  moduleInfo.version = releaseVersion;
  const releaseSha = await writeAndCommit(moduleInfo, `Release version ${releaseVersion}`);

  if (argv.tag) {
    createReleaseTag({ version: releaseVersion, sha: releaseSha });
  }

  const nextVersion = nextSnapshot(releaseVersion);
  moduleInfo.version = nextVersion;
  await writeAndCommit(moduleInfo, `Prepare new SNAPSHOT version ${nextVersion}`);

  console.log(
    `Successfully prepared release for ${releaseVersion} (${releaseSha.slice(0, 7)}) and bumped version to ${nextVersion}.`
  );
};

/**
 * Increments the given version to the next patch-level snapshot prerelease.
 * 
 * For instance, this increments `1.2.3` to `1.2.4-SNAPSHOT`.
 * 
 * @param {string} version the current (release) version to increment to next snapshot
 */
function nextSnapshot(version) {
  return semver.coerce(version, "prepatch").version + "-SNAPSHOT";
}

/**
 * Writes the given object to `module.txt` and commits the change stating the message.
 * 
 * @param {object} moduleInfo the content of `module.txt` to write
 * @param {string} message the commit message
 */
async function writeAndCommit(moduleInfo, message) {
  await fs.writeJSON(MODULE, moduleInfo, { spaces: 4 });
  await git.add({ fs, dir: ".", filepath: MODULE });
  return git.commit({
    fs,
    dir: ".",
    message,
  });
}

/**
 * Create an annotated tag for the release commit.
 * 
 * @param {string} release.version the release version (valid semver)
 * @param {string} release.sha the SHA of the release commit to annotate
 */
async function createReleaseTag(release) {
  await git.annotatedTag({
    fs,
    dir: ".",
    ref: release.version,
    object: release.sha,
    message: `Release ${release.version}`,
  });
}
