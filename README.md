# `gooey` CLI

A CLI tool for managing Terasology workspaces.

## Install

Clone this repo and run

```bash
npm install
npm link
```

You can make use of `gooey` on the command line.

> :construction: TODO: provide this as package so that it can be easily isntalled via `npm install -g gooey-cli`

## Usage

> :warning: Use all features of this little tool at own risk!

The `gooey` CLI tool provides several sub-commands (of varying maturity). Run `gooey --help` to get a brief overview.

```
gooey <command>

Commands:
  gooey distro                   list available distributions
  gooey clone [distro]           clone all modules of the given distribution
  gooey topics <org> [topics..]  add given topics to all repositories of the org
  gooey modules                  Handle common operations on local modules.
  gooey release                  Prepare and push a module release.

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

### Workspace / Modules

There a few commands to manage a Terasology workspace, e..g, to update (`git pull`) or reset (`git reset --hard ...`) all modules of the workspace.
This will run the respective `git` commands in parallel (full Omega workspace udpate in ~30 seconds).

`gooey modules lock` will write a lockfile `workspace-lock.json` with the committishs for all modules currently checked out. This can, in the future, be used to share/sync workspaces.

```
  gooey modules list    list all local modules
  gooey modules lock    write a lock-file to pin module versions (commits)
  gooey modules update  update all modules (git pull)
  gooey modules reset   reset and update all modules (git reset --hard)
```

> :construction: TODO: generalize this to the whole workspace, i.e., also manage libs like NUI.


