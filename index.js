#!/usr/bin/env node

const { Octokit } = require("@octokit/rest");
const octokit = new Octokit();
const { parse } = require('dot-properties')
const fs = require('fs-extra')
const execa = require("execa")

async function getDistro(distro) {
  return octokit.repos.getContents({
    owner: "Terasology",
    repo: "Index",
    path: `/distros/${distro.toLowerCase()}/gradle.properties`
  }).then(response => {  
    // content will be base64 encoded
    const content = Buffer.from(response.data.content, 'base64').toString()
    const modules = parse(content).extraModules;
    return modules.split(",")
  })
}

async function cloneModules(modules) {
  if (await fs.exists("./groovyw")) {
    await execa(
      "./groovyw", ["module", "get", ...modules],
      { stdio: "inherit" }
    )
  }
}

const cloneDistro = async (distro) => {
  const modules = await getDistro(distro)
  console.log(modules)
  cloneModules(modules)
}

module.exports = {
  cloneDistro
}