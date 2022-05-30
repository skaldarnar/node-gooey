#!/usr/bin/env node

import { Octokit } from "@octokit/rest";
import { parse } from "dot-properties";
const fs = require('fs-extra')
const execa = require("execa")

const indexRepo = {
  owner: "Terasology",
  repo: "Index"
}

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

async function getDistro(distro: string) {
  return octokit.repos.getContent({
    ...indexRepo,
    path: `/distros/${distro.toLowerCase()}/gradle.properties`
  }).then(response => {
    // @ts-ignore (content will be base64 encoded)
    const content = Buffer.from(response.data.content, 'base64').toString()
    const modules = parse(content).extraModules;
    if (typeof modules === "string") {
        return modules.split(",")
    }
    throw new Error("Unexpected data format for 'extraModules' field of distro's 'gralde.properties'.")
  })
}

const availableDistributions = async () =>
  octokit.repos.getContent({
    ...indexRepo,
    path: '/distros'
  }).then(response => {
    if (Array.isArray(response.data)) {
      const distros = response.data.filter(e => e.type === "dir").map(e => e.name);
      //console.debug(JSON.stringify(response, null, 2))
      return distros;
    }
    throw new Error("Unexpected data format for available distros (expected array).")    
  })

async function cloneModules(modules: string[]) {
  if (await fs.exists("./groovyw")) {
    await execa(
      "./groovyw", ["module", "get", ...modules],
      { stdio: "inherit" }
    )
  }
}

const cloneDistribution = async (distro: string) => {
  const modules = await getDistro(distro)
  console.log(modules)
  cloneModules(modules)
}

/**
 * Add given topics to each repository of the organization or user.
 */
async function addTopics(org: string, topics: string[]) {

  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org: "terasology"
  }).then(repos => repos.map(r => r.name));


  for (const repo of repos) {
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

export {
  cloneDistribution,
  availableDistributions,
  addTopics,
}
