import { assertType } from 'typescript-is'

export interface PackageJson {
  dependencies?: {
    [key: string]: string
  }
  devDependencies?: {
    [key: string]: string
  }
}

export function assertPackageJson(x: unknown): asserts x is PackageJson {
  assertType<PackageJson>(x)
}
