import exec from 'actions-exec-listener'

export class Compiler {
  runner: typeof exec.exec

  constructor(runner: typeof exec.exec) {
    this.runner = runner
  }

  makeCompileCommand(_: string): string {
    throw new Error('subclass responsibility. You cannot use this class directly.')
  }

  async compile() {
    
  }

  getCompiledFilePath() {
    throw new Error('subclass responsibility. You cannot use this class directly.')
  }
}
