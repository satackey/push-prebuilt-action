import exec from 'actions-exec-listener'
import format from 'string-format'

import { ActionBuilderBase } from './ActionBuilderBase'
import {
  ActionConfig,
  DockerActionConfig,
  assertIsDockerActionConfig,
} from './ActionConfig'

export class DockerActionBuilder extends ActionBuilderBase {
  actionConfig: DockerActionConfig

  constructor(yamlConfig: ActionConfig, workdir=process.cwd()) {
    super(yamlConfig, workdir)
    assertIsDockerActionConfig(yamlConfig)
    this.actionConfig = yamlConfig
  }

  private async loginToDockerRegistry() {
    const registry = this.configGetters.getDockerRegistry(false)

    // If registry is empty, don't login.
    if (registry === '') {
      console.log('Skip docker login because no Docker registry is specified.')
      return
    }

    // Get username and token, and run login command
    const user = this.configGetters.getDockerLoginUser(true)
    const token = this.configGetters.getDockerLoginToken(true)

    await exec.exec('docker login', [
      registry,
      '-u', user,
      '-p', token,
    ])
  }

  async build() {
    const repotag = this.configGetters.getDockerImageRepoTag(true)

    const unformattedBuildCommand = this.configGetters.getJavaScriptBuildCommand(true)
    const formattedBuildCommand = format(unformattedBuildCommand, {
      repotag,
    })

    await exec.exec(formattedBuildCommand, [], {
      cwd: this.workdir
    })

    this.actionConfig.runs.image = repotag
  }

  async push(force: boolean) {
    await this.loginToDockerRegistry()

    // docker push
    await exec.exec('docker push', [this.actionConfig.runs.image])

    // git push
    super.push(force)
  }
}
