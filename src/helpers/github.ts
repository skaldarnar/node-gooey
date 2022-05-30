
import {Octokit} from '@octokit/rest'
import {parse} from 'dot-properties'
import execa = require('execa')

const indexRepo = {
  owner: 'Terasology',
  repo: 'Index',
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

async function getDistro(distro: string) {
  return octokit.repos.getContent({
    ...indexRepo,
    path: `/distros/${distro.toLowerCase()}/gradle.properties`,
  }).then(response => {
    // @ts-ignore (content will be base64 encoded)
    const content = Buffer.from(response.data.content, 'base64').toString()
    const modules = parse(content).extraModules
    if (typeof modules === 'string') {
      return modules.split(',')
    }

    throw new Error("Unexpected data format for 'extraModules' field of distro's 'gralde.properties'.")
  })
}

const availableDistributions = async (): Promise<string[]> =>
  octokit.repos.getContent({
    ...indexRepo,
    path: '/distros',
  }).then(response => {
    if (Array.isArray(response.data)) {
      const distros = response.data.filter(e => e.type === 'dir').map(e => e.name)
      // console.debug(JSON.stringify(response, null, 2))
      return distros
    }

    throw new Error('Unexpected data format for available distros (expected array).')
  })

async function cloneModules(modules: string[]) {
  await execa(
    './groovyw', ['module', 'get', ...modules], {stdio: 'inherit'},
  )
}

const cloneDistribution = async (distro: string): Promise<void> => {
  const modules = await getDistro(distro)
  console.log(modules)
  cloneModules(modules)
}

/**
 * Add given topics to each repository of the organization or user.
 *
 * @param org the GitHub user or organization
 * @param topics  the list of topics to assign to each repository
 *
 * @returns when the topics on all repositories have been updated
 */
async function addTopics(org: string, topics: string[]): Promise<void> {
  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org: 'terasology',
  }).then(repos => repos.map(r => r.name))

  const results = []
  for (const repo of repos) {
    const task = octokit.repos.getAllTopics({
      owner: org,
      repo,
    })
    .then(res => res.data.names)
    .then(currentTopics => {
      const newTopics = [...new Set([...currentTopics, ...topics])]
      console.log(`Updating topics for '${org}/${repo}': ${JSON.stringify(currentTopics, null, 2)} >>> ${JSON.stringify(newTopics, null, 2)}`)
      return newTopics
    })
    .then(names => octokit.repos.replaceAllTopics({
      owner: org,
      repo,
      names,
    }))
    results.push(task)
  }

  await Promise.all(results)
}

export {
  cloneDistribution,
  availableDistributions,
  addTopics,
}
