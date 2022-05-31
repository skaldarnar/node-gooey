import {basename} from 'node:path'

import simpleGit, {
  GitError,
  PullResult,
  SimpleGit,
  StatusResult as GitStatusResult,
} from 'simple-git'

/**
 * Resolve the ref for the given repository, either to the commit SHA or the current branch.
 *
 * @param git the git client initialized to the target repository
 * @param exact whether to return a symbolic ref (e.g., branch name) or an exact SHA
 *
 * @returns the current ref for the target repository
 */
async function _getRef(git: SimpleGit, exact?: boolean): Promise<string> {
  const branches = await git.branch()
  if (branches.detached || branches.current === '' || exact) {
    return git.revparse('HEAD')
  }

  return branches.current
}

/**
 * Resolve the ref for the given repository, either to the commit SHA or the current branch.
 */
async function getRef(dir: string, exact?: boolean): Promise<string> {
  const git = simpleGit(dir, {binary: 'git'})
  return _getRef(git, exact)
}

export type StatusSummary = {
  dir: string;
  name: string;
  status: StatusResult;
};

async function status(dir: string, fetch: boolean): Promise<StatusSummary> {
  const git: SimpleGit = simpleGit({baseDir: dir, binary: 'git'})

  if (fetch) {
    await git.fetch()
  }

  const status = await _status(git)

  // TODO: revisit this return type
  return {
    dir,
    name: basename(dir),
    status,
  }
}

type UpdateOptions = {
  force: boolean;
};

export type UpdateResult = {
  dir: string,
  name: string,
  before: StatusResult,
  after: StatusResult,
  summary: PullResult | { error: GitError },
  currentBranch: string
}

async function update(dir: string, options: UpdateOptions): Promise<UpdateResult> {
  const _git = simpleGit({baseDir: dir, binary: 'git'})
  const currentBranch = await _getRef(_git, false)
  const before = await _status(_git)

  const summary = await _updateCmd(_git, options)

  const after = await _status(_git)

  // TODO: type definition for this return type
  return {
    dir,
    name: basename(dir),
    before,
    after,
    summary,
    currentBranch,
  }
}

export type ResetOptions = {
  force: boolean;
  fetch: boolean;
};

export type ResetResult = {
  dir: string,
  name: string,
  before: StatusResult,
  after: StatusResult,
  summary: string | GitError,
  currentBranch: string,
}

async function reset(dir: string, options: ResetOptions): Promise<ResetResult> {
  const _git = simpleGit({baseDir: dir, binary: 'git'})
  const currentBranch = await _getRef(_git, false)
  const before = await _status(_git)
  const result = await _resetCmd(_git, options)
  const after = await _status(_git)

  // Since we use a 'raw' command to reset to the default branch, there is no
  // command summary available. To bridge this gap, we manually compute the
  // diff between the 'before' and 'after' states.
  const summary = typeof result === 'string' ? await _git.diff([before.ref, after.ref]) : result

  // TODO: type definition for this return type
  return {
    dir,
    name: basename(dir),
    before,
    after,
    summary,
    currentBranch,
  }
}

export type CheckoutOptions = {
  force: boolean;
  branch: string;
  fetch?: boolean;
};

export type CheckoutResult = {
  dir: string,
  name: string,
  before: StatusResult,
  after: StatusResult,
  currentBranch: string,
  summary: string | GitError,
}

async function checkout(dir: string, options: CheckoutOptions): Promise<CheckoutResult> {
  const _git = simpleGit({baseDir: dir, binary: 'git'})
  const currentBranch = await _getRef(_git, false)
  const before = await _status(_git)
  const summary = await _checkoutCommand(_git, options)
  const after = await _status(_git)

  // Since we use a 'raw' command to reset to the default branch, there is no
  // command summary available. To bridge this gap, we manually compute the
  // diff between the 'before' and 'after' states.
  // const summary = {
  //     summary: await _git.diff([before.ref, after.ref])
  // }

  // TODO: type definition for this return type
  return {
    dir,
    name: basename(dir),
    before,
    after,
    summary,
    currentBranch,
  }
}

export type StatusResult = GitStatusResult & { ref: string };

async function _status(git: SimpleGit): Promise<StatusResult> {
  const result = await git.status()
  return {
    ...result,
    ref: await git.revparse('HEAD'),
  }
}

async function _updateCmd(git: SimpleGit, options: UpdateOptions) {
  try {
    const ops = ['--ff-only']
    if (options.force) {
      ops.push('--force')
    }

    const result = await git.pull(ops)
    return result
  } catch (error_) {
    // @ts-ignore
    const error: GitError = error_
    return {
      error,
    }
  }
}

async function _resetCmd(
  git: SimpleGit,
  options: ResetOptions,
): Promise<string | GitError> {
  if (options.fetch) {
    await git.fetch()
  }

  const defaultBranch = 'develop'
  const force = options.force ? ['--discard-changes'] : []
  try {
    const ops = [
      'switch',
      ...force,
      '--force-create',
      defaultBranch,
      `origin/${defaultBranch}`,
    ]

    return await git.raw(ops)
  } catch (error_) {
    // @ts-ignore
    const error: GitError = error_
    return error
  }
}

async function _checkoutCommand(
  git: SimpleGit,
  options: CheckoutOptions,
): Promise<string | GitError> {
  if (options.fetch) {
    await git.fetch()
  }

  const force = options.force ? ['--discard-changes'] : []
  try {
    const ops = ['switch', ...force, options.branch]
    const result = await git.raw(ops)
    return result
  } catch (error) {
    return {
      // @ts-ignore
      error,
    }
  }
}

export {getRef, status, update, reset, checkout}
