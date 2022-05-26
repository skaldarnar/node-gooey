//@ts-check

const { basename } = require("path");

/** @type {import("simple-git").SimpleGitFactory} */
const simpleGit = require('simple-git');

/**
 * Resolve the ref for the given repository, either to the commit SHA or the current branch.
 * 
 * @param {import("simple-git").SimpleGit} git
 * @param {boolean} [exact]
 */
async function getRef(git, exact) {
    const branches = await git.branch();
    if (branches.detached || branches.current === "" || exact) {
        return await git.revparse("HEAD");
    }
    return branches.current;
}

async function status(dir, fetch) {
    const _git = simpleGit({ baseDir: dir, binary: 'git' });
    const currentBranch = await getRef(_git);

    if (fetch) {
        await _git.fetch();
    }

    const status = await _git.status();

    //TODO revisit this return type
    return {
        dir,
        name: basename(dir),
        ref: await _git.revparse("HEAD"),
        status,
        currentBranch,
    }
}

async function update(dir, argv) {
    const _git = simpleGit({ baseDir: dir, binary: 'git' });
    const currentBranch = await getRef(_git, false);
    const before = await _status(_git);

    let summary = await _updateCmd(_git, argv);

    const after = await _status(_git);

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

async function reset(dir, argv) {
    const _git = simpleGit({ baseDir: dir, binary: 'git' });
    const currentBranch = await getRef(_git, false);
    const before = await _status(_git);
    await _resetCmd(_git, argv);
    const after = await _status(_git);

    // Since we use a 'raw' command to reset to the default branch, there is no
    // command summary available. To bridge this gap, we manually compute the 
    // diff between the 'before' and 'after' states.
    const summary = {
        summary: await _git.diff([before.ref, after.ref])
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

async function checkout(dir, argv) {
    const _git = simpleGit({ baseDir: dir, binary: 'git' });
    const currentBranch = await getRef(_git, false);
    const before = await _status(_git);
    const summary = await _checkoutCommand(_git, argv);
    const after = await _status(_git);

    // Since we use a 'raw' command to reset to the default branch, there is no
    // command summary available. To bridge this gap, we manually compute the 
    // diff between the 'before' and 'after' states.
    // const summary = {
    //     summary: await _git.diff([before.ref, after.ref])
    // }

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

async function _status(git) {
    const result = await git.status();
    result.ref = await git.revparse("HEAD");
    return result;
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
    if (argv.fetch) {
        await git.fetch();
    }

    const defaultBranch = "develop";
    const force = argv.force ? ['--discard-changes'] : []
    try {
        let options = [
            'switch',
            ...force,
            '--force-create',
            defaultBranch,
            `origin/${defaultBranch}`
        ];
        await git.raw(options);
        return {};
    } catch (e) {
        return {
            error: e
        };
    }
}

async function _checkoutCommand(git, argv) {
    if (argv.fetch) {
        await git.fetch();
    }

    const force = argv.force ? ['--discard-changes'] : []
    try {
        let options = [
            'switch',
            ...force,
            argv.branch
        ];
        const result = await git.raw(options);
        return result;
    } catch (error) {        
        return {
            error
        };
    }
}

module.exports = {
    getRef,
    status,
    update,
    reset,
    checkout,
}