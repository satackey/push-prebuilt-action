import { promises as fs } from 'fs'
import { execSync } from 'child_process'
import * as yaml from 'js-yaml'
import core from '@actions/core'
import exec from 'actions-exec-listener'
import { ExecOptions } from '@actions/exec/lib/interfaces'

import {
  ActionConfig,
  assertIsActionConfig,
} from './ActionConfig'


export type Getter = (required: boolean) => string

export interface BuilderConfigGetters {
  getGitCommitterName: Getter
  getGitCommitterEmail: Getter
  getGitCommitMessage: Getter
  getGitPushBranch: Getter
  getGitPushTags: Getter
  getJavaScriptBuildCommand: Getter
  getDockerLoginUser: Getter
  getDockerLoginToken: Getter
  getDockerImageTag: Getter
  getDockerRegistry: Getter
}

export class ActionBuilderBase {
  readonly workdir: string

  // user: string // = core.getInput('user', { required: true })
  // token: string // = core.getInput('token', { required: true })

  // gitUserName: string = 'github-actions'
  // gitUserEmail: string = 'actions@github.com'

  readonly yamlConfig: ActionConfig

  protected branch: string = ''
  protected tags: string[] = []

  constructor(yamlConfig: ActionConfig, configGetters: BuilderConfigGetters, workdir=process.cwd()): Promise<ActionBuilderBase> {
    this.yamlConfig = Object.assign({}, yamlConfig)
    this.workdir = workdir
    // this.validateConfig(configGetters)
    return Promise.resolve(this)
  }

  configure(configGetters: BuilderConfigGetters) {
    this.validateConfig(configGetters)
  }

  private async validateConfig(configGetters: BuilderConfigGetters) {
    const name = configGetters.getGitCommitterName(true)
    const email = configGetters.getGitCommitterEmail(true)
    this.configureGit(name, email)

    const branch = configGetters.getGitPushBranch(false)
    const tags = configGetters.getGitPushTags(false).split(' ')
    this.setGitCommitSetting(branch, tags)

    this.validatePersonalConfig(configGetters)
  }

  protected validatePersonalConfig(configGetters: BuilderConfigGetters) {
    throw new Error('subclass responsibility')
  }

  async configureGit(name: string, email: string) {
    const options: ExecOptions = { cwd: this.workdir }
    await exec.exec('git config --local user.name', [name], options)
    await exec.exec('git config --local user.email', [email], options)
  }

  // Check config is ready to commit.
  setGitCommitSetting(branch: string, tags: string[]) {
    // Execlude empty tag
    const invalidTags = tags.filter(tag => tag === '')
    if (invalidTags.length !== 0) {
      throw new Error('Specified tags has a empty item.')
    }

    // Check branch or tags are specified.
    if (branch === '' && tags.length === 0) {
      throw new Error('Either branch or tags must be specified to commit.')
    }

    this.branch = branch
    this.tags = tags
  }

  async exists(aPath: string): Promise<boolean> {
    const absolutePath = aPath.startsWith('/') ? aPath : `${this.workdir}/${aPath}`

    try {
      await fs.stat(absolutePath)
      return true
    } catch (e) {
      // Throw an error if the file/dir is an error other than non-existent.
      if (!e.message.includes('no such file or directory')) {
        throw e
      }
    }
    return false
  }

  resolveAbsoluteFor(aPath: string) {
    return aPath.startsWith('/') ? aPath : `${this.workdir}/${aPath}`
  }

  async build() {
    throw new Error('subclass responsibility')
  }

  async saveActionConfig(saveYamlAs: string) {
    const yamlText = yaml.safeDump(this.yamlConfig)
    await fs.writeFile(saveYamlAs, yamlText, 'utf8')
  }

  async commit(branch: string, tags: string[]) {
    if (branch === '') {
      // If branch is not specified, checkout detached HEAD.
      await exec.exec('git checkout --detach HEAD')
    } else {
      // Create branch by specified name.
      await exec.exec('git checkout -b', [branch])
    }

    // Commit
    await exec.exec('git add .')
    await exec.exec('git commit -m [auto]')

    // If some tags are specified, tag commit.
    if (tags.length > 0) {
      await exec.exec('git tag', tags)
    }
  }

  async push(force: boolean) {
    // base command
    let command = 'git push'

    // if force option true, add git force argument: -f
    if (force) {
      command = `${command} -f`
    }

    // If there is one or more tags, use it.
    // Overwise, args will be empty.
    // args = this.tags.length === 0 ? [] : this.tags
    const args = this.tags

    if (this.branch !== '') {
      command = `${command} -u origin`
      args.unshift(this.branch)
    } else if (this.tags.length !== 0) {
      command = `${command} origin`
    }

    // yield `${command} ${args.join(' ')}`
    await exec.exec(command, args)
  }
}

// A mock for test
export class ActionBuilderBaseMock extends ActionBuilderBase {
  protected validatePersonalConfig(configGetters: BuilderConfigGetters) {
    console.log('Since this instance is the mock, skipping run validatePersonalConfig.')
  }
}
