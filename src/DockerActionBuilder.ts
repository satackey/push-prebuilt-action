import exec from 'actions-exec-listener'

import {
  ActionBuilderBase,
  BuilderConfigGetters,
} from './ActionBuilderBase'
import {
  DockerActionConfig,
  assertIsDockerActionConfig,
} from './ActionConfig'

export class DockerActionBuilder extends ActionBuilderBase {
  yamlConfig: DockerActionConfig
  imageTag: string

  protected async validatePersonalConfig(configGetters: BuilderConfigGetters) {
    // Check if action.yml is using Docker.
    assertIsDockerActionConfig(this.yamlConfig)

    this.imageTag = configGetters.getDockerImageTag(true)

    const registry = configGetters.getDockerRegistry(false)

    // If registry is empty, don't login.
    if (registry === '') {
      console.log('Skip docker login because no Docker registry is specified.')
      return
    }
  
    // Get username and token, and run login command
    const user = configGetters.getDockerLoginUser(true)
    const token = configGetters.getDockerLoginToken(true)

    await exec.exec('docker login', [
      registry,
      '-u', user,
      '-p', token,
    ])
  }

  async build() {
    await exec.exec('docker build -t', [this.imageTag, '.'])
    this.yamlConfig.runs.image = this.imageTag
  }

  async push(force: boolean) {
    // docker push
    await exec.exec('docker push', [this.imageTag])

    // git push
    super.push(force)
  }
}
