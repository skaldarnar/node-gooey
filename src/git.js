//@ts-check

const { basename } = require("path");
const chalk = require("chalk");
const simpleGit = require('simple-git');

const git = simpleGit();

/**
 * Resolve the ref for the given repository, either to the commit SHA or the current branch.
 * 
 * @param {string} dir 
 * @param {boolean} [exact]
 */
async function getRef(dir, exact) {
    git.cwd(dir);
    const branches = await git.branch();
    if (branches.detached || branches.current === "" || exact) {
        return await git.revparse("HEAD");
    }
    return branches.current;
}

async function status(dir, fetch) {
    const _git = simpleGit({baseDir: dir});
    const currentBranch = await getRef(dir);

    const status = await git.status();

    return {
        dir,
        name: basename(dir),
        ref: await _git.revparse("HEAD"),
        status,
        currentBranch,
    }
}

async function update(dir) {
    const _git = simpleGit({baseDir: dir});
    const currentBranch = await getRef(dir, false);

    const before = await _git.status();
    before.ref = await _git.revparse("HEAD");

    let summary = {};
    try {
        summary = (await _git.pull({'--ff-only': true}));
    } catch (e) {
        summary.error = e;
    }

    const after = await _git.status();
    after.ref = await _git.revparse("HEAD");

    return {
        dir,
        name: basename(dir),
        before,
        after,
        summary,
        currentBranch
    }
}

module.exports = {
    getRef,
    status,
    update,
}