import { PackageManager } from './PackageManager'
import { Yarn } from './Yarn'
import { Npm } from './Npm'

export const createPackageManager = async (projectDir: string): Promise<PackageManager> => {
  const yarn = new Yarn(projectDir)
  const npm = new Npm(projectDir)

  const hasYarnLockfile = await yarn.hasLockfile()
  const hasNpmLockfile = await npm.hasLockfile()

  if (hasYarnLockfile && hasNpmLockfile) {
    throw new Error(
      'Both package-lock.json and yarn.lock found.\n' + 
      `We do not automatically install dependencies to avoid building with upgraded packages unknowingly.\n` +
      'Either leave one of the lockfiles,\n' + 
      'or run the installation command like `npm ci` manually before running it.'
    )
  }

  if (hasNpmLockfile) {
    return npm
  }

  if (hasYarnLockfile) {
    return yarn
  }

  throw new Error(
    'Neither package-lock.json nor yarn.lock were found.\n' + 
    `We do not automatically install dependencies to avoid building with upgraded packages unknowingly.\n` +
    'Either add the lockfile to the repository,\n' + 
    'or run the installation command like `npm i` manually before running it.'
  )
}
