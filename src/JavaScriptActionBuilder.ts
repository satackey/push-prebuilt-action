import * as core from '@actions/core'
import exec from 'actions-exec-listener'
import format from 'string-format'

import { ActionBuilder } from './ActionBuilder'

import { JavaScriptActionConfig } from './ActionConfig'
import { JavaScriptBuilderConfigGetters } from './ActionBuilderConfigGetters'
import { createPackageManager } from './PackageManager/CreatePackageManager'
import { PackageManager } from './PackageManager/PackageManager'

export class JavaScriptActionBuilder extends ActionBuilder {
  actionConfig: JavaScriptActionConfig
  configGetters: JavaScriptBuilderConfigGetters
  packageManager?: PackageManager
  distPrefix = ''

  constructor(yamlConfig: JavaScriptActionConfig, configGetters: JavaScriptBuilderConfigGetters, workdir: string) {
    super(yamlConfig)
    this.actionConfig = yamlConfig
    this.configGetters = configGetters
    this.workdir = workdir
  }

  private async installNccGlobally() {
    core.startGroup('npm install -g @zeit/ncc')
    await exec.exec('npm install -g @zeit/ncc')
    core.endGroup()
  }

  private async installDependenciesIfNotInstalled() {
    this.packageManager = await createPackageManager(this.workdir)
    await this.packageManager.installDependenciesIfNotInstalled()
  }

  async dependsTtsc(): Promise<boolean> {
    return this.packageManager != null ? await this.packageManager.isTtscUsed() : false
  }

  private async transpileIfDependsTtsc() {
    if (await this.dependsTtsc()) {
      core.info(`info: This action seems to depend on ttypescript, so I'll transpile using ttsc before bundling.`)
      const distDir = `ttsc-dist`
      await this.packageManager!.exec('ttsc --outDir', [distDir])

      this.replaceActionConfigEntrypoints(this.distPrefix, distDir)
    }
  }

  async build() {
    await this.installNccGlobally()
    await this.installDependenciesIfNotInstalled()

    await this.transpileIfDependsTtsc()
    const unformattedBuildCommand = this.configGetters.getJavaScriptBuildCommand(true)
    await this.packageManager!.run(this.makeBuildCommand(unformattedBuildCommand, true))

    this.replaceActionConfigEntrypoints(this.distPrefix, 'dist')
  }

  makeBuildCommand(unformattedCommand: string, log=false): string {
    if (this.hasActionConfigDistInRuns(log)) {
      return formatBuildCommand(unformattedCommand)
    }
    return formatBuildCommand(
      unformattedCommand,
      this.actionConfig.runs.main,
      this.actionConfig.runs.post,
      this.actionConfig.runs.pre
    )

    function formatBuildCommand(unformatted: string, main?: string, post?: string, pre?: string) {
      return format(unformatted, {
        pre: pre || '',
        main: main || '',
        post: post || '',
      })
    }
  }

  hasActionConfigDistInRuns(log=false) {
    const result = this.actionConfig.runs.main.startsWith('dist/')

    if (log) {
      core.info(
        'Since runs.main starts with `dist/`,' + 
        `I'd disable the replacement of entrypoints such as main, post, pre in run.`
      )
    }

    if (result) {
      checkIfAllRunsSpecifiedDist(this.actionConfig.runs)
    }

    return result

    function checkIfAllRunsSpecifiedDist(runs: JavaScriptActionConfig['runs']) {
      const commonErrorMessage = 'must starts with `dist/` because runs.main starts with `dist/`.'
      // if post/pre were specified, they must be starts with `dist/`
      if (runs.post != null && runs.post.startsWith(`dist/`)) {
        throw new Error(`runs.post ${commonErrorMessage}`)
      }

      if (runs.pre != null && runs.pre.startsWith(`dist/`)) {
        throw new Error(`runs.pre ${commonErrorMessage}`)
      }
    }
  }

  replaceActionConfigEntrypoints(oldSubstr: string, newSubStr: string) {
    const replace = (str: string) => str.replace(oldSubstr, newSubStr)

    if (this.actionConfig.runs.pre != null) {
      this.actionConfig.runs.pre = replace(this.actionConfig.runs.pre)
    }

    this.actionConfig.runs.main = replace(this.actionConfig.runs.main)

    if (this.actionConfig.runs.post != null) {
      this.actionConfig.runs.post = replace(this.actionConfig.runs.post)
    }
  }
}
