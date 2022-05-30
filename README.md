# `gooey` CLI

A CLI tool for managing Terasology workspaces.

# Install

Clone this repo and run

```bash
npm install
npm link
```

You can make use of `gooey` on the command line.

> :construction: TODO: provide this as package so that it can be easily isntalled via `npm install -g gooey`

# Usage

> :warning: Use all features of this little tool at own risk!

<!-- usage -->
```sh-session
$ npm install -g gooey
$ gooey COMMAND
running command...
$ gooey (--version)
gooey/0.2.0 linux-x64 node-v14.16.0
$ gooey --help [COMMAND]
USAGE
  $ gooey COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`gooey distro`](#gooey-distro)
* [`gooey distro clone [DISTRO]`](#gooey-distro-clone-distro)
* [`gooey distro list`](#gooey-distro-list)
* [`gooey help [COMMAND]`](#gooey-help-command)
* [`gooey module`](#gooey-module)
* [`gooey module bump [MODULE]`](#gooey-module-bump-module)
* [`gooey module release [MODULE]`](#gooey-module-release-module)
* [`gooey plugins`](#gooey-plugins)
* [`gooey plugins:install PLUGIN...`](#gooey-pluginsinstall-plugin)
* [`gooey plugins:inspect PLUGIN...`](#gooey-pluginsinspect-plugin)
* [`gooey plugins:install PLUGIN...`](#gooey-pluginsinstall-plugin-1)
* [`gooey plugins:link PLUGIN`](#gooey-pluginslink-plugin)
* [`gooey plugins:uninstall PLUGIN...`](#gooey-pluginsuninstall-plugin)
* [`gooey plugins:uninstall PLUGIN...`](#gooey-pluginsuninstall-plugin-1)
* [`gooey plugins:uninstall PLUGIN...`](#gooey-pluginsuninstall-plugin-2)
* [`gooey plugins update`](#gooey-plugins-update)
* [`gooey workspace [CATEGORIES]`](#gooey-workspace-categories)
* [`gooey workspace load`](#gooey-workspace-load)
* [`gooey workspace pin`](#gooey-workspace-pin)
* [`gooey workspace status [CATEGORIES]`](#gooey-workspace-status-categories)

## `gooey distro`

View and clone different module distributions.

```
USAGE
  $ gooey distro

DESCRIPTION
  View and clone different module distributions.
```

_See code: [dist/commands/distro/index.ts](https://github.com/skaldarnar/node-gooey/blob/v0.2.0/dist/commands/distro/index.ts)_

## `gooey distro clone [DISTRO]`

Clone all modules of the given distribution to the local workspace.

```
USAGE
  $ gooey distro clone [DISTRO]

ARGUMENTS
  DISTRO  [default: iota] The distribution to clone. Default is 'iota', the minimal reasonable module set.

DESCRIPTION
  Clone all modules of the given distribution to the local workspace.
```

## `gooey distro list`

List available module distribution sets.

```
USAGE
  $ gooey distro list
```

## `gooey help [COMMAND]`

Display help for gooey.

```
USAGE
  $ gooey help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for gooey.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.12/src/commands/help.ts)_

## `gooey module`

Manage a module and its dependencies and dependants.

```
USAGE
  $ gooey module

DESCRIPTION
  Manage a module and its dependencies and dependants.
```

_See code: [dist/commands/module/index.ts](https://github.com/skaldarnar/node-gooey/blob/v0.2.0/dist/commands/module/index.ts)_

## `gooey module bump [MODULE]`

Bump the version for a specific module, and update all references ([3mmodule.txt[23m)

```
USAGE
  $ gooey module bump [MODULE] [-n] [-s major|minor|patch|premajor|preminor|prepatch]

ARGUMENTS
  MODULE  The module to increment the version on.

FLAGS
  -n, --dry-run         Perform a dry run without any changes made.
  -s, --scope=<option>  [default: minor] Increment a version by the specified level.
                        <options: major|minor|patch|premajor|preminor|prepatch>

DESCRIPTION
  Bump the version for a specific module, and update all references (module.txt)

EXAMPLES
  $ gooey-cli module:bump
```

## `gooey module release [MODULE]`

Prepare and tag a module release.

```
USAGE
  $ gooey module release [MODULE] [-t] [-s major|premajor|minor]

ARGUMENTS
  MODULE  The module to prepare a release for.

FLAGS
  -s, --scope=<option>  [default: minor] Semver scope to make the release for.
                        <options: major|premajor|minor>
  -t, --tag             Create an annotated tag for the release.

DESCRIPTION
  Prepare and tag a module release.

  This is an automation for the module release process as described in

  	https://github.com/MovingBlocks/Terasology/wiki/Release%3A-Modules

EXAMPLES
  $ gooey-cli module:release --tag --scope major Health
      Prepare a new major release for the 'Health' module and tag it.

  $ gooey-cli module:release --scope minor
      Prepapre a minor release without tag for the module this command is run from.
```

## `gooey plugins`

List installed plugins.

```
USAGE
  $ gooey plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ gooey plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.0/src/commands/plugins/index.ts)_

## `gooey plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ gooey plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ gooey plugins add

EXAMPLES
  $ gooey plugins:install myplugin 

  $ gooey plugins:install https://github.com/someuser/someplugin

  $ gooey plugins:install someuser/someplugin
```

## `gooey plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ gooey plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ gooey plugins:inspect myplugin
```

## `gooey plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ gooey plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ gooey plugins add

EXAMPLES
  $ gooey plugins:install myplugin 

  $ gooey plugins:install https://github.com/someuser/someplugin

  $ gooey plugins:install someuser/someplugin
```

## `gooey plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ gooey plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLES
  $ gooey plugins:link myplugin
```

## `gooey plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ gooey plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ gooey plugins unlink
  $ gooey plugins remove
```

## `gooey plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ gooey plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ gooey plugins unlink
  $ gooey plugins remove
```

## `gooey plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ gooey plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ gooey plugins unlink
  $ gooey plugins remove
```

## `gooey plugins update`

Update installed plugins.

```
USAGE
  $ gooey plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

## `gooey workspace [CATEGORIES]`

Manage a Terasology workspace.

```
USAGE
  $ gooey workspace [CATEGORIES]

ARGUMENTS
  CATEGORIES  (root|libs|modules) [default: root,libs,modules] the categories of sub-repositories to work on. (default
              all)

DESCRIPTION
  Manage a Terasology workspace.

EXAMPLES
  $ gooey-cli workspace:status
```

_See code: [dist/commands/workspace/index.ts](https://github.com/skaldarnar/node-gooey/blob/v0.2.0/dist/commands/workspace/index.ts)_

## `gooey workspace load`

Load a workspace from a JSON lockfile.

```
USAGE
  $ gooey workspace load [-i <value>] [-f]

FLAGS
  -f, --force             Discard all local changes without asking.
  -i, --lockfile=<value>  The lockfile to restore the workspace from. (default: <root>/workspace-lock.json)

DESCRIPTION
  Load a workspace from a JSON lockfile.

EXAMPLES
  $ gooey-cli workspace:load

  $ gooey-cli workspace:load --lockfile terasology.lock --force
```

## `gooey workspace pin`

Write a lock-file to pin module versions ({italic workspace-lock.json})

```
USAGE
  $ gooey workspace pin [-o <value>] [--exact]

FLAGS
  -o, --lockfile=<value>  the lockfile for pinning/restoring a workspace
  --exact                 pin the commit SHA instead of symbolic ref

DESCRIPTION
  Write a lock-file to pin module versions ({italic workspace-lock.json})

EXAMPLES
  $ gooey-cli workspace:pin

  $ gooey-cli workspace:pin --exact --lockfile=terasology.lock
```

## `gooey workspace status [CATEGORIES]`

Inspect the workspace or a specific workspace element.

```
USAGE
  $ gooey workspace status [CATEGORIES] [--offline]

ARGUMENTS
  CATEGORIES  (root|libs|modules) [default: root,libs,modules] the categories of sub-repositories to work on. (default
              all)

FLAGS
  --offline  fetch remote state before showing state (git fetch)

DESCRIPTION
  Inspect the workspace or a specific workspace element.

EXAMPLES
  $ gooey-cli workspace:status
```
<!-- commandsstop -->

# References

Check out [skaldarnar/gh-terasology](https://github.com/skaldarnar/gh-terasology) for GitHub-specific tooling for Terasology workspaces.
