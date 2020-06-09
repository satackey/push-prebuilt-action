import { promises as fs } from 'fs'
import { PackageManager } from './PackageManager'

export class Npm extends PackageManager {
  LOCK_FILE = `package-lock.json`
  RUN_PREFIX = `npx`

  async installDependencies() {
    await this.exec(`npm ci`)
  }

  async hasLockfile() {
    try {
      await fs.stat(`${this.projectDir}/package-lock.json`)
      return true
    } catch (e) {
      // Throw an error if the file/dir is an error other than non-existent.
      if (e.code !== 'ENOENT') {
        throw e
      }
    }
    return false
  }
}
