import { Compiler } from './Compiler'

export class TtscTranspiler extends Compiler {
  private getOutDir(): string {
    return `ttsc-dist`
  }

  getCompileCommandFor(aFile: string): [string, string[]] {
    return [`ttsc --outDir`, [this.getOutDir()]]
  }

  getCompiledFilePathFor(aFile: string): string {
    return `${this.getOutDir()}/${aFile.replace(/\.ts$/, '.js')}`
  }
}
