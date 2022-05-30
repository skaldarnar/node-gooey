# 🟩 `gooey` CLI

A CLI tool for managing [Terasology](https://github.com/MovingBlocks/Terasology) workspaces.

## Install

Clone this repo and run

```bash
$ npm install       # install dependencies
$ npm run build     # compile source files
$ npm install -g .  # install the local package to global scope
```

You can now use `gooey` on the command line:

```sh-sessions
$ gooey --version
gooey/0.2.0 linux-x64 node-v16.15.0
```

## Usage

> :warning: Use all features of this little tool at own risk!

The `gooey` CLI tool provides several sub-commands (of varying maturity).

Some commands require a `GITHUB_TOKEN` environment variable to hold a valid access token (see [Creating a personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) for more information).

Run `gooey help` to get a brief overview.

```sh-session
$ gooey help
CLI tool for working with Terasology workspaces.

VERSION
  gooey/0.2.0 linux-x64 node-v14.16.0

USAGE
  $ gooey [COMMAND]

TOPICS
  distro     View and clone different module distributions.
  module     Manage a module and its dependencies and dependants.
  plugins    List installed plugins.
  workspace  Manage a Terasology workspace.

COMMANDS
  distro     View and clone different module distributions.
  help       Display help for gooey.
  module     Manage a module and its dependencies and dependants.
  plugins    List installed plugins.
  workspace  Manage a Terasology workspace.
```

## References & Related Repositories

- **[MovingBlocks/Terasology](https://github.com/MovingBlocks/Terasology)**
  
  _The Terasology project._

- **[skaldarnar/gh-terasology](https://github.com/skaldarnar/gh-terasology)**

  _To generate a changelog for Terasology engine and/or module releases._
