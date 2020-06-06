#!/usr/bin/env node

const { Octokit } = require("@octokit/rest");

const octokit = new Octokit();
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

module.exports = {
  cloneDistribution,
  availableDistributions
}