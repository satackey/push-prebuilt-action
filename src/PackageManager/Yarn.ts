import { PackageManager } from "./PackageManager"

export class Yarn extends PackageManager {
  LOCK_FILE = `yarn.lock`
  RUN_PREFIX = `yarn run`

  async installDependencies() {
    this.exec(`yarn install --frozen-lockfile --non-interactive`)
  }

  hasLockfile() {
    return this.existsRelative(`yarn.lock`)
  }

}
