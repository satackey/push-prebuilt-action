import { promises as fs,  } from 'fs'
import { ExecOptions } from '@actions/exec/lib/interfaces'
import * as core from '@actions/core'
import * as path from 'path'
import exec from 'actions-exec-listener'
import { PackageJson, assertPackageJson } from './PackageJsonSchema'

export class PackageManager {
  packageJson?: PackageJson
  projectDir: string
  readonly LOCK_FILE: string = ''
  readonly RUN_PREFIX: string = ''

  constructor(projectDir: string) {
    this.projectDir = path.resolve(projectDir)
  }

  async existsRelative(aPath: string): Promise<boolean> {
    try {
      await fs.stat(`${this.projectDir}/${aPath}`)
      return true
    } catch (e) {
      // Throw an error if the file/dir is an error other than non-existent.
      if (e.code !== 'ENOENT') {
        throw e
      }
    }
    return false
  }

  async exec(command: string, args?: string[], options?: ExecOptions) {
    const execCwd = async () => await exec.exec(command, args, {
      cwd: this.projectDir,
      ...options
    })

    // ---
    if (!options?.silent) {
      const argsStr = args != null ? args.join(' ') : ''
      return await core.group(`${command} ${argsStr}`, execCwd)
    }
    return execCwd()
  }

  async isTtscUsed(): Promise<boolean> {
    const packageJson = await this.getPackagesJson()
    return (
      (packageJson.dependencies != null && includesTtypescriptInObjectKeys(packageJson.dependencies)) ||
      (packageJson.devDependencies != null && includesTtypescriptInObjectKeys(packageJson.devDependencies))
    )

    // ---

    function includesTtypescriptInObjectKeys(obj: object) {
      return Object.keys(obj).includes('ttypescript')
    }
  }

  async getPackagesJson(): Promise<PackageJson> {
    if (this.packageJson != null) {
      return this.packageJson
    }
    this.packageJson = await load(`${this.projectDir}/package.json`)
    return await this.getPackagesJson()

    // ---

    async function load(absoluteDir: string) {
      const unsafePackagesJson = JSON.parse((await fs.readFile(absoluteDir)).toString())
      assertPackageJson(unsafePackagesJson)
      return unsafePackagesJson
    }
  }

  async installDependenciesIfNotInstalled() {
    if (await this.hasInstalledModules()) {
      core.info(`info: node_modules found. skipping install dependencies.`)
      return
    }
    await this.installDependencies()
  }

  async installDependencies() {
    throw new Error('subclass responsibility')
  }

  async hasInstalledModules(): Promise<boolean> {
    try {
      await fs.stat(`${this.projectDir}/node_modules`)
      return true
    } catch (e)  {
      // Throw an error if the file/dir is an error other than non-existent.
      if (e.code !== 'ENOENT') {
        throw e
      }
    }
    return false
  }

  async hasLockfile(): Promise<boolean> {
    return await this.existsRelative(this.LOCK_FILE)
  }

  async run(command: string, args?: string[], options?: ExecOptions) {
    return await this.exec(this.RUN_PREFIX, [command, ...(args != null ? args : [])], options)
  }
}
