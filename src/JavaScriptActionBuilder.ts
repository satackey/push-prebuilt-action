import * as core from '@actions/core'
import exec from 'actions-exec-listener'
import format from 'string-format'

import { ActionBuilder } from './ActionBuilder'

import {
  ActionConfig,
  JavaScriptActionConfig,
  assertIsJavaScriptActionConfig,
} from './ActionConfig'
import { UnionBuilderConfigGetters, JavaScriptBuilderConfigGetters } from './ActionBuilderConfigGetters'

export class JavaScriptActionBuilder extends ActionBuilder {
  actionConfig: JavaScriptActionConfig
  configGetters: JavaScriptBuilderConfigGetters

  constructor(yamlConfig: ActionConfig, configGetters: UnionBuilderConfigGetters, workdir=process.cwd()) {
    super(yamlConfig, configGetters, workdir)
    assertIsJavaScriptActionConfig(yamlConfig)
    this.actionConfig = yamlConfig

    this.configGetters = configGetters
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

  private async installDependenciesIfNotInstalled() {
    if (await this.exists(this.resolveAbsoluteFor(`${this.workdir}/node_modules`))) {
      console.log(`info: node_modules found. skipping install dependencies.`)
      return
    }
    await this.installDependencies()
  }


  private async installDependencies() {
    const log = (file: string, pkg: string, level='info') => console.log(`${level}: ${file} found. Install dependencies with ${pkg}.`)

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
    await this.installDependenciesIfNotInstalled()

    const unformattedBuildCommand = this.configGetters.getJavaScriptBuildCommand(true)
    const formattedBuildCommand = format(unformattedBuildCommand, {
      main: this.actionConfig.runs.main
    })

    await exec.exec(formattedBuildCommand, [], {
      cwd: this.workdir
    })

    this.actionConfig.runs.main = 'dist/index.js'
  }
}
