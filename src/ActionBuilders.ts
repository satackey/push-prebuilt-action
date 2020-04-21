import { promises as fs } from 'fs'
import { execSync } from 'child_process'
import * as yaml from 'js-yaml'
import core from '@actions/core'
import exec from 'actions-exec-listener'

import { ActionBuilderBase, BuilderConfigGetters } from './ActionBuilderBase'

import {
  DockerActionConfig, JavaScriptActionConfig,
  assertIsActionConfig, assertIsDockerActionConfig, assertIsJavaScriptActionConfig, ActionConfig
} from './ActionConfig'

// https://stackoverflow.com/a/44688997
type nonEmptyString = never; // Cannot be implicitly cast to
function isNonEmptyString(str: string): str is nonEmptyString {
    return str && str.length > 0; // Or any other logic, removing whitespace, etc.
}

export class JavaScriptActionBuilder extends ActionBuilderBase {
  yamlConfig: JavaScriptActionConfig
  buildCommand: string

  protected validatePersonalConfig(configGetters: BuilderConfigGetters) {
    assertIsJavaScriptActionConfig(this.yamlConfig)

    this.buildCommand = configGetters.getJavaScriptBuildCommand(true)
  }

  private async installNcc() {
    core.startGroup('npm install -g @zeit/ncc')
    await exec.exec('npm install -g @zeit/ncc')
    core.endGroup()
  }

  async getInstallManager(): Promise<'yarn' | 'npm' | 'duplicate' | 'none'> {
    if (await this.exists('package-lock.json') && await this.exists('yarn.lock')) {
      return 'duplicate'
    }

    if (await this.exists('package-lock.json')) {
      return 'npm'
    }

    if (await this.exists('yarn.lock')) {
      return 'yarn'
    }

    return 'none'
  }

  private async installWithNpm() {
    core.startGroup('npm ci')
    await exec.exec('npm ci')
    core.endGroup()
  }

  private async installWithYarn() {
    core.startGroup('yarn install --frozen-lockfile --non-interactive')
    await exec.exec('yarn install --frozen-lockfile --non-interactive')
    core.endGroup()
  }


  async installDependencies() {
    const log = (file, pkg, level='info') => console.log(`${level}: ${file} found. Install dependencies with ${pkg}.`)

    switch (await this.getInstallManager()) {
      case 'duplicate':
        throw new Error('Both package-lock.json and yarn.lock found.')

      case 'npm':
        log('package-lock.json', 'npm')
        await this.installWithNpm()
        break

      case 'yarn':
        log('yarn.lock', 'yarn')
        await this.installWithYarn()
        break

      default:
        throw new Error('Neither package-lock.json nor yarn.lock were found.')
    }
  }

  async build() {
    await this.installNcc()
    await this.installDependencies()
    await exec.exec(this.buildCommand)
    this.yamlConfig.runs.main = 'dist/index.js'
  }
}
