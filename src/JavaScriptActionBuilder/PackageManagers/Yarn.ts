import { PackageManager } from './PackageManager'
import { ExecOptions } from '@actions/exec/lib/interfaces'

export class Yarn extends PackageManager {
  LOCK_FILE = `yarn.lock`
  RUN_PREFIX = `yarn run`

  async exec(command: string, args?: string[], options?: ExecOptions) {
    return await super.exec(`yarn run ${command}`, args, options)
  }

  async installDependencies() {
    await this.exec(`yarn install --frozen-lockfile --non-interactive`)
  }
}
