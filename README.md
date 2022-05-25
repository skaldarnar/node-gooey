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

The `gooey` CLI tool provides several sub-commands (of varying maturity).
It expects the `GITHUB_TOKEN` environment variable to hold a valid access token (see [Creating a personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) for more information).
Run `gooey --help` to get a brief overview.


```
gooey <command>

Commands:
  gooey distro                   list available distributions
  gooey clone [distro]           clone all modules of the given distribution
  gooey topics <org> [topics..]  add given topics to all repositories of the org
  gooey changelog                Compile a raw changelog based on PR titles
                                 (requires GITHUB_TOKEN env variable to be set)
  gooey module <m>               Manage a module and its dependencies and
                                 dependants.
  gooey release                  Prepare and tag a module release.
  gooey workspace                Manage a Terasology workspace

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

### Workspace / Modules

There a few commands to manage a Terasology workspace, e..g, to update (`git pull`) or reset (`git switch --discard-changes --force-create ...`) all modules of the workspace.
This will run the respective `git` commands in parallel (full Omega workspace udpate in ~30 seconds).

`gooey modules lock` will write a lockfile `workspace-lock.json` with the committishs for all modules currently checked out. This can, in the future, be used to share/sync workspaces.

```
  gooey modules list    list all local modules
  gooey modules lock    write a lock-file to pin module versions (commits)
  gooey modules update  update all modules (git pull)
  gooey modules reset   reset and update all modules (git reset --hard)
```

> :construction: TODO: generalize this to the whole workspace, i.e., also manage libs like NUI.

### Changelog

The `changelog` command allows to assemble a list of changes in the form of **merged pull requests**. 
It can either target a specific repository by providing both `--owner` and `--repo` or all repositories of an owner by just providing `--owner`.
The output can directly be written to file (`--out`) or pretty-printend to the console (`--pretty`).+

#### Examples

Print the changelog since latest release for MovingBlocks/Terasology to the console.
```
  gooey changlog --owner MovingBlocks --repo Terasology --pretty                
```

List all users that contributed to a Terasology module since Feb 1, 2021.
```
  gooey changlog --owner Terasology --since="2021-02-01" --users              
```

For more information run `gooey changelog help`:

```
gooey changelog

Compile a raw changelog based on PR titles

Options:
  --version               Show version number                          [boolean]
  --help                  Show help                                    [boolean]
  --out, -o               Write the changelog to the specified file     [string]
  --pretty                Pretty print the output with colors and formatting
                                                                       [boolean]
  --since                 The timestamp (ISO 8601) to start the changelog from.
                          If both 'owner' and 'repo' are specified this will use
                          the timestamp of the latest release.          [string]
  --until                 The timestamp (ISO 8601) until when the changelog
                          should be computed. Current date if omitted.  [string]
  --owner                 The GitHub owner or organization   [string] [required]
  --repo                  The GitHub repository - if omitted, collect from all
                          repos of 'owner'                              [string]
  --users, --contribtors  List all users that contributed to the changeset
                                                                       [boolean]
```
