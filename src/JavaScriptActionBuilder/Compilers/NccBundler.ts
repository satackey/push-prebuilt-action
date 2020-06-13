import { Compiler } from './Compiler'

export class NccBundler extends Compiler {
  private getOutDir(aFile: string): string {
    return `dist/${aFile}`
  }

  getCompileCommandFor(aFile: string): [string, string[]] {
    return [`ncc build -o`, [this.getOutDir(aFile), aFile]]
  }

  getCompiledFilePathFor(aFile: string): string {
    return `${this.getOutDir(aFile)}/index.js`
  }
}
