import exec from 'actions-exec-listener'
import format from 'string-format'

import { ActionBuilder } from '../ActionBuilder'
import {
  DockerActionConfig,
  assertIsDockerActionConfig,
} from '../ActionConfig'
import { DockerBuilderConfigGetters } from '../ActionBuilderConfigGetters'

export class DockerActionBuilder extends ActionBuilder {
  actionConfig: DockerActionConfig
  configGetters: DockerBuilderConfigGetters

  constructor(yamlConfig: DockerActionConfig, configGetters: DockerBuilderConfigGetters, workdir: string) {
    super(yamlConfig)
    assertIsDockerActionConfig(yamlConfig)
    this.actionConfig = yamlConfig
    this.configGetters = configGetters
    this.workdir = workdir
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

    // Todo: use stdin
    // https://github.com/actions/toolkit/pull/360
    // waiting for new release.
    await exec.exec('docker login', [
      registry,
      '-u', user,
      '-p', token,
    ])
  }

  async build() {
    const repotag = this.configGetters.getDockerImageRepoTag(true)

    const unformattedBuildCommand = this.configGetters.getDockerBuildCommand(true)
    const formattedBuildCommand = format(unformattedBuildCommand, {
      repotag,
    })

    await exec.exec(formattedBuildCommand, [], {
      cwd: this.workdir
    })

    this.actionConfig.runs.image = `docker://${repotag}`
  }

  async push(force: boolean) {
    await this.loginToDockerRegistry()
    await exec.exec('docker push', [this.actionConfig.runs.image.replace('docker://', '')])

    // git push
    super.push(force)
  }
}
