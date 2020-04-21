import { ActionBuilderBaseMock, BuilderConfigGetters } from './ActionBuilderBase'
import { ActionConfig } from './ActionConfig'
import os from 'os'
import { execSync } from 'child_process'
import { exec } from 'child-process-promise'

const standardActionConfig: ActionConfig = {
  name: 'test name',
  description: 'test description',
  runs: {
    using: 'docker'
  }
}

const TEST_DOCKER_REGISTRY_URL = process.env['TEST_DOCKER_REGISTRY_URL'] || ''
const TEST_GIT_USER_NAME = 'github-actions'
const TEST_GIT_USER_EMAIL = 'actions@gmail.com'

const standardConfigGetters: BuilderConfigGetters = {
  getGitCommitterName: (required) =>  'git-commiter-name',
  getGitCommitterEmail: (required) => 'git-commiter-email@example.com',
  getGitCommitMessage: (required) => 'git commit message',
  getGitPushBranch: (required) => 'git-push-branch',
  getGitPushTags: (required) => 'git-push-tag1 git-push-tag2',
  getJavaScriptBuildCommand: (required) => 'yarn pack',
  getDockerLoginUser: (required) => 'satackey',
  getDockerLoginToken: (required) => 'docker.pkg.github.com',
  getDockerImageTag: (required) => 'docker.pkg.github.com/satackey/doc',
  getDockerRegistry: (required) => {
    if (required && TEST_DOCKER_REGISTRY_URL === '') {
      throw new Error('DOCKER_REGISTRY_URL is not specified')
    }
    return TEST_DOCKER_REGISTRY_URL
  },
}

// test

describe('ActionBuilderBaseMock', () => {
  let cwd: string
  let actionBuilder: ActionBuilderBaseMock

  beforeEach(() => {
    cwd = os.tmpdir()
    actionBuilder = new ActionBuilderBaseMock(standardActionConfig, standardConfigGetters, cwd)
  })

  describe('configureGit', () => {
    it('should configure username and email of local gitconfig ', async () => {
      await exec('git init', { cwd })

      const actionBuilder = new ActionBuilderBaseMock(standardActionConfig, standardConfigGetters, cwd)
      await actionBuilder.configureGit(TEST_GIT_USER_NAME, TEST_GIT_USER_EMAIL)

      const { stdout: usernameStdout } = await exec('git config --local user.name', { cwd })
      // stdout has a newline
      expect(usernameStdout.replace('\n', '')).toBe(TEST_GIT_USER_NAME)

      const { stdout: emailStdout } = await exec('git config --local user.email', { cwd })
      expect(emailStdout.replace('\n', '')).toBe(TEST_GIT_USER_EMAIL)
    })
  })

  describe('setGitCommitConfig', () => {
    it('succeeds when both branch and tags are specified, and sets them instance property', async () => {
      // const cwd = os.tmpdir()
      // const actionBuilder = new ActionBuilderBaseMock(standardActionConfig, standardConfigGetters, cwd)

      const branch = 'specified_branch'
      const tags = ['tag1', 'tag2']
      actionBuilder.setGitCommitSetting(branch, tags)

      expect(actionBuilder['branch']).toBe(branch)
      expect(actionBuilder['tags']).toStrictEqual(tags)
    })

    it('sets instance property when only branch is specified', async () => {
      const branch = 'branch_only'
      actionBuilder.setGitCommitSetting('branch_only', [])
      expect(actionBuilder['branch']).toBe(branch)
      expect(actionBuilder['tags']).toStrictEqual([])
    })

    it('throws error when tags have an empty item', async () => {
      expect(() => actionBuilder.setGitCommitSetting('', [''])).toThrow()

      // check empty branch name is provided
      expect(() => actionBuilder.setGitCommitSetting('branch_name_is_unrelated', ['', 'tag_name_is_unrelated'])).toThrow()
    })

    it('throws error when there are empty branch and empty string of tags', async () => {
      expect(() => actionBuilder.setGitCommitSetting('', ['', ''])).toThrow()
    })

    it('throws error when there is empty tag list', async () => {
      expect(() => actionBuilder.setGitCommitSetting('', [])).toThrow()
    })
  })
})