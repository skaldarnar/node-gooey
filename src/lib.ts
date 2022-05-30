#!/usr/bin/env node

const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});
const { parse } = require('dot-properties')
const fs = require('fs-extra')
const execa = require("execa")

const indexRepo = {
  owner: "Terasology",
  repo: "Index"
}

async function getDistro(distro) {
  return octokit.repos.getContents({
    ...indexRepo,
    path: `/distros/${distro.toLowerCase()}/gradle.properties`
  }).then(response => {
    // content will be base64 encoded
    const content = Buffer.from(response.data.content, 'base64').toString()
    const modules = parse(content).extraModules;
    return modules.split(",")
  })
}

const availableDistributions = async () =>
  octokit.repos.getContents({
    ...indexRepo,
    path: '/distros'
  }).then(response => {
    const distros = response.data.filter(e => e.type === "dir").map(e => e.name);
    console.log(JSON.stringify(response, null, 2))

    return distros;
  })

async function cloneModules(modules) {
  if (await fs.exists("./groovyw")) {
    await execa(
      "./groovyw", ["module", "get", ...modules],
      { stdio: "inherit" }
    )
  }
}

const cloneDistribution = async (distro) => {
  const modules = await getDistro(distro)
  console.log(modules)
  cloneModules(modules)
}

/**
 * Add given topics to each repository of the organization or user.
 * @param {string} org
 * @param {Array<string>} topics 
 */
async function addTopics(org, topics) {

  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org: "terasology"
  }).then(repos => repos.map(r => r.name));


  for (repo of repos) {
    const currentTopics = (await octokit.repos.getAllTopics({
      owner: org,
      repo
    })).data.names;

    let names = Array.from(new Set([...currentTopics, ...topics]));

    console.log(`Updating topics for '${org}/${repo}': ${JSON.stringify(currentTopics, null, 2)} >>> ${JSON.stringify(names, null, 2)}`)

    await octokit.repos.replaceAllTopics({
      owner: org,
      repo, 
      names
    })
  }

}

module.exports = {
  cloneDistribution,
  availableDistributions,
  addTopics,
}
