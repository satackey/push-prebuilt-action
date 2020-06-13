import exec from 'actions-exec-listener'

export class Compiler {
  exec: typeof exec.exec

  constructor(runner: typeof exec.exec) {
    this.exec = runner
  }

  getCompileCommandFor(aFile: string): [string, string[]?] {
    throw new Error('subclass responsibility. You cannot use this class directly.')
  }

  getCompiledFilePathFor(aFile: string): string {
    throw new Error('subclass responsibility. You cannot use this class directly.')
  }

  async compile(aFile: string): Promise<string> {
    await this.exec(...this.getCompileCommandFor(aFile))
    return this.getCompiledFilePathFor(aFile)
  }
}
