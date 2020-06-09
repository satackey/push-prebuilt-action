import { promises as fs } from 'fs'
import { ExecOptions } from '@actions/exec/lib/interfaces'
import * as yaml from 'js-yaml'
import * as core from '@actions/core'
import exec from 'actions-exec-listener'
import format from 'string-format'

import {
  ActionConfig,
} from './ActionConfig'
import { UnionBuilderConfigGetters, defaultConfigGetters, JavaScriptBuilderConfigGetters, DockerBuilderConfigGetters, IntersectionBuilderConfigGetters } from './ActionBuilderConfigGetters'

export class ActionBuilder {
  workdir: string = process.cwd()

  readonly actionConfig: ActionConfig
  actionConfigPath: string = ''

  private branch = ''
  private tags: string[] = []

  constructor(yamlConfig: ActionConfig) {
    this.actionConfig = Object.assign({}, yamlConfig)
  }

  async configureGit(name: string, email: string) {
    const options = { cwd: this.workdir }
    await exec.exec('git config --local user.name', [name], options)
    await exec.exec('git config --local user.email', [email], options)
  }

  // setGitCommitSetting checks configs are ready to commit and saves them.
  private assertCommitArgs(branch: string, tags: string[], message: string) {
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




  async exec(command: string, args?: string[], options?: ExecOptions) {
    const execCwd = () => exec.exec(command, args, {
      cwd: this.workdir,
      ...options
    })

    if (!options?.silent) {
      const argsStr = args != null ? args.join(' ') : ''
      return core.group(`${command} ${argsStr}`, execCwd)
    }
    return execCwd()
  }

  async exists(aPath: string): Promise<boolean> {
    const absolutePath = this.resolveAbsoluteFor(aPath)

    try {
      await fs.stat(absolutePath)
      return true
    } catch (e) {
      // Throw an error if the file/dir is an error other than non-existent.
      if (e.code !== 'ENOENT') {
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

  async cleanUp(requiredItems: string[]) {
    if (requiredItems.length > 0) {
      new Error('Specify the required files/dirs to clean up.')
    }

    if (requiredItems.filter(name => name === '').length > 0) {
      new Error('There is empty item in required dirs/files')
    }

    if (requiredItems.find(req => req === '.') && requiredItems.length > 1) {
      new Error('Cannot specify other dirs/files when you specified current dir.')
    }

    if (requiredItems[0] === '.') {
      console.log('There is no unnecessary files.')
      return
    }

    const unnecessaryItems = new Set(await fs.readdir(this.workdir))
    requiredItems.forEach(req => unnecessaryItems.delete(req))

    // required at least 1 item in the argument.
    await Promise.all([Promise.resolve(), ...Array.from(unnecessaryItems.values()).map(async req =>
      await fs.rmdir(req, { recursive: true })
    )])
  }

  async commit(unformattedBranch: string, tags: string[], message: string) {
    const formattedBranch = format(unformattedBranch, {
      branch: this.getCurrentBranchName()
    })
    this.assertCommitArgs(formattedBranch, tags, message)
    await this.commitWithoutCheckingArgs(formattedBranch, tags, message)
  }

  async getCurrentBranchName() {
    const { exitCode, stdoutStr } = await exec.exec(`git symbolic-ref --short -q HEAD`, [], { cwd: this.workdir, failOnStdErr: false })
    return exitCode === 0 ? stdoutStr : ''
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
export class ActionBuilderBaseMock extends ActionBuilder {
  protected validatePersonalConfig(_: UnionBuilderConfigGetters) {
    console.log('Since this instance is the mock, skipping run validatePersonalConfig.')
  }
}
