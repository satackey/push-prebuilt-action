import * as core from '@actions/core'

import { createBuilder } from './src/CreateActionBuilder'
import { IntersectionBuilderConfigGetters } from './src/ActionBuilderConfigGetters'

const main = async () => {
  const configGetters = createConfigGetters()
  const actionBuilder = await createBuilder(process.cwd(), configGetters)

  await actionBuilder.build()
  await actionBuilder.saveActionConfig()
  await actionBuilder.cleanUp(core.getInput('exclude-from-cleanup', { required: true }).split(' '))

  const commitMessage = core.getInput('commit-message')
  if (commitMessage !== '') {
    await actionBuilder.configureGit(
      core.getInput('committer-name', { required: true }),
      core.getInput('committer-email', { required: true })
    )

    const pushBranch = core.getInput('push-branch')
    const releaseTags = core.getInput('release-tags').split(' ').filter(tag => tag !== '')
    await actionBuilder.commit(pushBranch, releaseTags, commitMessage)
    await actionBuilder.push(core.getInput('force-push', { required: true }) === 'true')
  }
}

const createConfigGetters = (): IntersectionBuilderConfigGetters => ({
  getJavaScriptBuildCommand: (required) => core.getInput(`js-build-command`, { required }),
  getDockerRegistry: (required) => core.getInput(`docker-registry`, { required }),
  getDockerLoginUser: (required) => core.getInput(`docker-user`, { required }),
  getDockerLoginToken: (required) => core.getInput(`docker-token`, { required }),
  getDockerImageRepoTag: (required) => core.getInput(`docker-repotag`, { required }),
  getDockerBuildCommand: (required) => core.getInput(`docker-build-command`, { required }),
})

main().catch(e => {
  console.error(e)
  core.setFailed(e)
})