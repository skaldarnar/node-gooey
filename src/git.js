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

function remoteStatusSymbol(ahead, behind) {
    if (ahead && behind) {
        return "±";
    }
    if (ahead && !behind) {
        return "+";
    }
    if (!ahead && behind) {
        return "-";
    }
    return ""
}

async function status(dir, fetch) {
    const name = basename(dir).padEnd(32);
    const currentBranch = await getRef(dir);
    
    git.cwd(dir);
    const status = await git.status();

    let msg = chalk`{dim module} ${name.padEnd(32)} ${remoteStatusSymbol(status.ahead, status.behind).padStart(2)} `;

    if (status.isClean()) {
        msg += chalk`{cyan ${currentBranch}}`;
    } else {
        msg += chalk`{yellow ${currentBranch}}`;
        status.files.forEach(f => msg += `\n\t${f.index}${f.working_dir} ${f.path}`);
    }
    return msg;
}

module.exports = {
    getRef,
    status,
}