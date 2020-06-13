import format from 'string-format'
import exec from 'actions-exec-listener'

import { Compiler } from './Compiler'

export class CustomCompiler extends Compiler {
  unformattedCompileCommand: string
  unformattedCompiledPath: string

  constructor(runner: typeof exec.exec, compileCommand: string, compiledPath: string) {
    super(runner)
    this.unformattedCompileCommand = compileCommand
    this.unformattedCompiledPath = compiledPath
  }

  getCompileCommandFor(aFile: string): [string, string[]?] {
    return [this.format(this.unformattedCompileCommand, aFile)]
  }

  getCompiledFilePathFor(aFile: string): string {
    return this.format(this.unformattedCompiledPath, aFile)
  }

  private format(command: string, entry: string): string {
    return format(command, { entry })
  }
}
