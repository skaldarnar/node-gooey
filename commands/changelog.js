//@ts-check

const chalk = require("chalk");
const { graphql } = require("@octokit/graphql");
const fs = require("fs-extra")

/**
 * @typedef {Object} PullRequest
 * @member {string} title
 * @member {number} number
 * @member {string} author
 */

module.exports.command = "changelog";

module.exports.describe = "Compile a raw changelog based on PR titles";

module.exports.builder = (yargs) => {
  yargs.option("out", {
    alias: "o",
    type: "string"
  })
  .option("pretty", {
    describe: "Pretty print the output with colors and formatting",
    type: "boolean",
  })
};

module.exports.handler = async (argv) => {
    const target = {
      repo: "Terasology",
      owner: "MovingBlocks",
    }
    const since = await dateOfLastRelease(target);
    const merged = await mergedPrsSince(since, target);

    const lines = merged.map(e => display(e.node, argv));

    if (argv.out) {
      await fs.writeFile(argv.out, lines.join("\n"))
    } else {
      for (const line of lines) {
        console.log(line)
      }
    }
};

function display(node, options) {
  if (options.pretty) {
    return chalk`{bold ${node.title}} {blue #${node.number}} (@${node.author.login})`
  } else {
    return `${node.title} #${node.number} (@${node.author.login})`
  }
}

async function dateOfLastRelease(target) {
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

async function mergedPrsSince(since, target) {
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
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }`;

  const searchString = `repo:${target.owner}/${target.repo} is:merged merged:>=${since}`;
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