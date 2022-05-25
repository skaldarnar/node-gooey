//@ts-check

const { basename } = require("path");


const simpleGit = require('simple-git');

/**
 * Resolve the ref for the given repository, either to the commit SHA or the current branch.
 * 
 * @param {string} dir 
 * @param {boolean} [exact]
 */
async function getRef(dir, exact) {
    const _git = simpleGit({baseDir: dir, binary: 'git'});
    const branches = await _git.branch();
    if (branches.detached || branches.current === "" || exact) {
        return await _git.revparse("HEAD");
    }
    return branches.current;
}

async function status(dir, fetch) {
    const _git = simpleGit({baseDir: dir});
    const currentBranch = await getRef(dir);

    const status = await _git.status();

    return {
        dir,
        name: basename(dir),
        ref: await _git.revparse("HEAD"),
        status,
        currentBranch,
    }
}

async function update(dir, argv) {
    const _git = simpleGit({baseDir: dir, binary: 'git'});
    const currentBranch = await getRef(dir, false);

    const before = await _git.status();
    before.ref = await _git.revparse("HEAD");

    let summary = {};
    if (argv.reset) {
        summary = await _resetCmd(_git, argv);
    } else {
        summary = await _updateCmd(_git, argv);
    }

    const after = await _git.status();
    after.ref = await _git.revparse("HEAD");

    if (!summary.summary) {
        // Since we use a 'raw' command to reset to the default branch, there is no
        // command summary available. To bridge this gap, we manually compute the 
        // diff between the 'before' and 'after' states.
        const diff = await _git.diff([before.ref, after.ref]);
        summary.summary = diff;
    }

    //TODO: type definition for this return type
    return {
        dir,
        name: basename(dir),
        before,
        after,
        summary,
        currentBranch
    }
}

async function _updateCmd(git, argv) {
    let summary = {};
    try {
        let options = [
            '--ff-only'
        ];
        if (argv.force) {
            options.push('--force')
        }
        summary = (await git.pull(options));
    } catch (e) {
        summary.error = e;
    }
    return summary;
}

async function _resetCmd(git, argv) {
    try {
        let options = [
            'switch',
            '--discard-changes',
            '--force-create',
            'develop', //TODO: use actual default branch
            'origin/develop'
        ];
        await git.raw(options);
        return {};
    } catch (e) {
        return {
            error: e
        };
    }
}

module.exports = {
    getRef,
    status,
    update,
}