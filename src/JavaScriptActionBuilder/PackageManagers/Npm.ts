import { PackageManager } from './PackageManager'
import { ExecOptions } from '@actions/exec/lib/interfaces'

export class Npm extends PackageManager {
  LOCK_FILE = `package-lock.json`
  RUN_PREFIX = `npx`

  async exec(command: string, args?: string[], options?: ExecOptions) {
    return await super.exec(`npx ${command}`, args, options)
  }

  async installDependencies() {
    await super.exec(`npm ci`)
  }
}
