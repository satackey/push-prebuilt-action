import * as core from '@actions/core'
import exec from 'actions-exec-listener'

import { ActionBuilder } from '../ActionBuilder/ActionBuilder'
import { JavaScriptActionConfig } from '../ActionConfig'
import { JavaScriptBuilderConfigGetters } from '../ActionBuilder/ActionBuilderConfigGetters'
import { createPackageManager } from './PackageManagers/CreatePackageManager'
import { PackageManager } from './PackageManagers/PackageManager'
import { DefaultBundler } from './Compilers/DefaultBundler'
import { CustomCompiler } from './Compilers/CustomCompiler'
import { Compiler } from './Compilers/Compiler'

export class JavaScriptActionBuilder extends ActionBuilder {
  actionConfig: JavaScriptActionConfig
  configGetters: JavaScriptBuilderConfigGetters
  packageManager?: PackageManager
  distPrefix = ''
  cachedCompiler?: Compiler

  constructor(yamlConfig: JavaScriptActionConfig, configGetters: JavaScriptBuilderConfigGetters, workdir: string) {
    super(yamlConfig)
    this.actionConfig = JSON.parse((JSON.stringify(yamlConfig)))
    core.debug(`constructor: ${JSON.stringify(this.actionConfig.runs)}`)
    this.configGetters = configGetters
    this.workdir = workdir
  }

  private async installNccGlobally() {
    core.debug(`installNccGlobally: ${JSON.stringify(this.actionConfig.runs)}`)
    core.startGroup('npm install -g @zeit/ncc')
    await exec.exec('npm install -g @zeit/ncc')
    core.endGroup()
  }

  private async installDependenciesIfNotInstalled() {
    this.packageManager = await createPackageManager(this.workdir)
    await this.packageManager.installDependenciesIfNotInstalled()
  }

  async build() {
    core.debug(`build: ${JSON.stringify(this.actionConfig.runs)}`)
    await this.installNccGlobally()
    await this.installDependenciesIfNotInstalled()
    await this.buildAllEntrypoints()
  }

  async buildAllEntrypoints() {
    core.debug(`buildAllEntrypoints: ${JSON.stringify(this.actionConfig.runs)}`)
    const entrypointCandidacies: ('pre' | 'main' | 'post')[] = [`pre`, `main`, `post`]
    await Promise.all(entrypointCandidacies.map(() => this.buildSingleEntrypoint))
  }

  async buildSingleEntrypoint(entry: 'pre' | 'main' | 'post') {
    core.debug(`buildSingleEntrypoint: typeof this.actionConfig ${typeof this.actionConfig}`)
    core.debug(`buildSingleEntrypoint: ${JSON.stringify(this.actionConfig)}`)
    core.debug(`buildSingleEntrypoint, this.actionConfig,runs: ${JSON.stringify(this.actionConfig.runs)}`)
    if (typeof this.actionConfig.runs[entry] !== 'string') {
      if (entry === 'main') {
        throw new Error('What?How can main be undefined??????')
      }
      return
    }

    const compiled = await this.getCompiler().compile(this.actionConfig.runs[entry]!)

    if (this.shouldReplaceEntrypoint(entry)) {
      core.info(
        `Since runs.${entry} starts with \`dist/\`,` +
        `I'd disable the replacement of it.`
      )

      return
    }

    this.actionConfig.runs[entry] = compiled
  }

  getCompiler(): Compiler {
    const createCompiler = (): Compiler => {
      if (this.configGetters.getJavaScriptBuildCommand(false) === '') {
        return new CustomCompiler(
          this.packageManager!.exec,
          this.configGetters.getJavaScriptBuildCommand(true),
          this.configGetters.getJavaScriptBuiltPath(true)
        )
      }

      return new DefaultBundler(this.packageManager!)
    }

    // ---

    if (this.cachedCompiler === undefined) {
      this.cachedCompiler = createCompiler()
    }
    return this.cachedCompiler
  }

  shouldReplaceEntrypoint(entrypoint: keyof JavaScriptActionConfig['runs']): boolean {
    if (typeof this.actionConfig.runs[entrypoint] !== 'string') {
      return false
    }
    return this.actionConfig.runs[entrypoint]!.startsWith('dist/')
  }
}
