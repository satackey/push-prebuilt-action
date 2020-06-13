import * as core from '@actions/core'

import { createBuilder } from './src/ActionBuilder/CreateActionBuilder'
import { IntersectionBuilderConfigGetters } from './src/ActionBuilder/ActionBuilderConfigGetters'
import { Branch } from './src/Branch'

const main = async () => {
  const configGetters = createConfigGetters()
  const actionBuilder = await createBuilder(process.cwd(), configGetters)

  if (core.getInput('push-branch') !== '' && core.getInput(`delete-branch`, { required: true }) === `true`) {
    const branch = new Branch()
    await branch.deleteBranchIfExists(core.getInput(`delete-branch-ref`, { required: true }), core.getInput('push-branch', { required: true }))
    return
  }

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
  getJavaScriptBuiltPath: (required) => core.getInput(`js-built-path`, { required }),
  getJavaScriptOverrideMain: (required) => core.getInput(`js-override-main`, { required }),
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
