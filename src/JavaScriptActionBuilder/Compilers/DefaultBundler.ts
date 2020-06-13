import { PackageManager } from '../PackageManagers/PackageManager'
import { TtscTranspiler } from './TtscTranspiler'
import { NccBundler } from './NccBundler'
import { Compiler } from './Compiler'

export class DefaultBundler extends Compiler {
  packageManager: PackageManager

  constructor(packageManager: PackageManager) {
    super(packageManager.exec)
    this.packageManager = packageManager
  }

  async compile(aFile: string): Promise<string> {
    const nccReady = await this.transpileIfTtscIsUsed(aFile)
    const bundled = await this.bundleWithNcc(nccReady)
    return bundled
  }

  async transpileIfTtscIsUsed(aFile: string): Promise<string> {
    if (await this.packageManager.isTtscUsed()) {
      const ttsc = new TtscTranspiler(this.packageManager.exec)
      return await ttsc.compile(aFile)
    }

    return aFile
  }

  async bundleWithNcc(aFile: string): Promise<string> {
    return await new NccBundler(this.packageManager.exec).compile(aFile)
  }
}