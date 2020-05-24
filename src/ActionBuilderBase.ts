import { promises as fs } from 'fs'
import * as yaml from 'js-yaml'
import exec from 'actions-exec-listener'

import {
  ActionConfig,
} from './ActionConfig'


export type Getter = (required: boolean) => string

export interface BuilderConfigGetters {
  getJavaScriptBuildCommand: Getter
  getDockerRegistry: Getter
  getDockerLoginUser: Getter
  getDockerLoginToken: Getter
  getDockerImageRepoTag: Getter
  getDockerBuildCommand: Getter
}

const defaultGetter: Getter = (required) => {
  if (required) {
    throw new Error('This is default getter.')
  }
  return ''
}
export const defaultConfigGetters: BuilderConfigGetters = {
  getJavaScriptBuildCommand: defaultGetter,
  getDockerRegistry: defaultGetter,
  getDockerLoginUser: defaultGetter,
  getDockerLoginToken: defaultGetter,
  getDockerImageRepoTag: defaultGetter,
  getDockerBuildCommand: defaultGetter,
}

export class ActionBuilderBase {
  readonly workdir: string

  readonly actionConfig: ActionConfig
  actionConfigPath: string = ''

  configGetters: BuilderConfigGetters

  private branch = ''
  private tags: string[] = []

  constructor(yamlConfig: ActionConfig, workdir=process.cwd()) {
    this.actionConfig = Object.assign({}, yamlConfig)
    this.workdir = workdir
    this.configGetters = defaultConfigGetters
  }

  configure(configGetters: BuilderConfigGetters) {
    this.configGetters = configGetters
  }

  async configureGit(name: string, email: string) {
    const options = { cwd: this.workdir }
    await exec.exec('git config --local user.name', [name], options)
    await exec.exec('git config --local user.email', [email], options)
  }

  // setGitCommitSetting checks configs are ready to commit and saves them.
  assertCommitArgs(branch: string, tags: string[], message: string) {
    // Execlude empty tag
    const invalidTags = tags.filter(tag => tag === '')
    if (invalidTags.length !== 0) {
      throw new Error('Specified tags has a empty item.')
    }

    // Check branch or tags are specified.
    if (branch === '' && tags.length === 0) {
      throw new Error('Either branch or tags must be specified to commit.')
    }

    if (message === '') {
      throw new Error('Commit message must be specified.')
    }
  }

  async exists(aPath: string): Promise<boolean> {
    const absolutePath = this.resolveAbsoluteFor(aPath)

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

  protected async saveActionConfigAs(filename: string) {
    const yamlText = yaml.safeDump(this.actionConfig)
    await fs.writeFile(filename, yamlText, 'utf8')
  }

  async saveActionConfig() {
    if (this.actionConfigPath === '') {
      throw new Error('actionConfigPath must be specified.')
    }

    await this.saveActionConfigAs(this.actionConfigPath)
  }

  async commit(branch: string, tags: string[], message: string) {
    this.assertCommitArgs(branch, tags, message)
    await this.commitWithoutCheckingArgs(branch, tags, message)
  }

  protected async commitWithoutCheckingArgs(branch: string, tags: string[], message: string) {
    if (branch === '') {
      // If branch is not specified, checkout detached HEAD.
      await exec.exec('git checkout --detach HEAD')
    } else {
      // Create branch by specified name.
      await exec.exec('git checkout -b', [branch])
      this.branch = branch
    }

    // Commit
    await exec.exec('git add .')
    await exec.exec('git commit -m', [message])

    // If some tags are specified, tag commit.
    if (tags.length > 0) {
      await exec.exec('git tag', tags)
      this.tags = tags
    }
  }

  async push(force: boolean) {
    // base command
    let command = 'git push origin'

    // if force option is true, add git force argument: -f
    if (force) {
      command = `${command} -f`
    }

    // If there is one or more tags, use it.
    // Overwise, args will be empty.
    // args = this.tags.length === 0 ? [] : this.tags
    const args = [this.branch, ...this.tags].filter(arg => arg !== '')

    // yield `${command} ${args.join(' ')}`
    await exec.exec(command, args)
  }
}

// A mock for test
export class ActionBuilderBaseMock extends ActionBuilderBase {
  protected validatePersonalConfig(_: BuilderConfigGetters) {
    console.log('Since this instance is the mock, skipping run validatePersonalConfig.')
  }
}
