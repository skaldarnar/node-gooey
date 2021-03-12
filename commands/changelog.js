//@ts-check

const chalk = require("chalk");
const { graphql } = require("@octokit/graphql");
const fs = require("fs-extra");

/**
 * @typedef {Object} PullRequest
 * @member {string} title
 * @member {number} number
 * @member {string} author
 */

module.exports.command = "changelog";

module.exports.describe = "Compile a raw changelog based on PR titles (requires GITHUB_TOKEN env variable to be set)";

module.exports.builder = (yargs) => {
  yargs
  .example('$0 changlog --owner MovingBlocks --repo Terasology --pretty', 'Print the changelog since latest release for MovingBlocks/Terasology to the console')
  .example('$0 changlog --owner Terasology --since="2021-02-01" --users', 'List all users that contributed to a Terasology module since Feb 1, 2021.')
  .option("out", {
    alias: "o",
    type: "string",
    describe: "Write the changelog to the specified file"
  })
  .option("pretty", {
    describe: "Pretty print the output with colors and formatting",
    type: "boolean",
  })
  .option("since", {
    describe: "The timestamp (ISO 8601) to start the changelog from. If both 'owner' and 'repo' are specified this will use the timestamp of the latest release.",
    type: "string"
  })
  .option("until", {
    describe: "The timestamp (ISO 8601) until when the changelog should be computed. Current date if omitted.",
    type: "string"
  })
  .option("owner", {
    describe: "The GitHub owner or organization",
    type: "string"
  })
  .demandOption("owner", "Owner must be specified")
  .option("repo", {
    describe: "The GitHub repository - if omitted, collect from all repos of 'owner'",
    type: "string"
  })
  .option("users", {
    describe: "List all users that contributed to the changeset",
    type: "boolean",
    alias: "contribtors"
  }
  )
  .check((argv, options) => {
    if (!argv.since && !argv.repo) {
      throw new Error("At least one of 'since' and 'repo' must be specified");
    } else {
      return true
    }
  })
};

module.exports.handler = async (argv) => {
    // we check in the 'builder' above that either 'since' or both 'owner' and 'repo' are set
    const since = argv.since || await dateOfLastRelease(argv.owner, argv.repo);

    const from = argv.repo ? `repo:${argv.owner}/${argv.repo}` : `org:${argv.owner}`
    const merged = await mergedPrsSince(since, argv.until, from);

    let lines;
    if (argv.users) {
      lines = [... new Set(merged.map(e => e.node.author.login))].sort().map(user => `@${user}`);
    } else {
      lines = merged.map(e => display(e.node, argv));
    }

    if (argv.out) {
      await fs.writeFile(argv.out, lines.join("\n"))
    } else {
      for (const line of lines) {
        console.log(line)
      }
    }
};

function display(node, options) {
  let prRef;
  if (options.owner && options.repo) {
    prRef = `#${node.number}`
  } else {
    prRef = `${node.repository.nameWithOwner}#${node.number}`
  }
  if (options.pretty) {
    return chalk`{bold ${node.title}} {blue ${prRef}} (@${node.author.login})`
  } else {
    return `${node.title} ${prRef} (@${node.author.login})`
  }
}

async function dateOfLastRelease(owner, repo) {
  const { repository } = await graphql(
    `
    query DateOfLatestRelease($repo: String!, $owner: String!) {
      repository(name: $repo, owner: $owner) {
        releases(last: 1) {
          nodes {
            publishedAt
          }
        }
      }
    }
    `,
    {
      ...target,
      headers: {
        authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    }
  );

  return repository.releases.nodes[0].publishedAt;
}

async function mergedPrsSince(since, until, from) {
  const query = `query Changelog($searchString: String!, $after: String) {
    search(query: $searchString, type: ISSUE, first: 50, after: $after) {
      edges {
        node {
          ... on PullRequest {
            title
            number
            author {
              ... on User {
                login
              }
            }
            repository {
              name
              nameWithOwner
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }`;

  const timespan = until ? `${since}..${until}` : `>=${since}`;

  const searchString = `${from} is:merged merged:${timespan}`;
  const headers = {
    authorization: `token ${process.env.GITHUB_TOKEN}`,
  };

  // pagination
  let result = [];
  let pageInfo = {};
  do {
    const { search} = await graphql(query, { searchString, after: pageInfo.endCursor, headers });

    //console.log(`hasNextPage: ${search.pageInfo.hasNextPage}: ${search.pageInfo.endCursor}`)
    result.push(search.edges);

    pageInfo = search.pageInfo;
  } while (pageInfo.hasNextPage)

  return result.flat();
}