import { is, assertType } from 'typescript-is'

// ActionConfig
export interface ActionConfig {
  name: string
  author?: string
  description: string
  inputs?: {
    [key: string]: {
      description: string
      required: boolean
      default?: string
    }
  }
  outouts?: {
    [key: string]: {
      description: string
    }
  }
  runs: {
    using: 'docker' | 'node12'
    [key: string]: any
  }
  branding?: {
    icon?: string
    color?: string
  }
}

export function assertIsActionConfig(actionConfig: any): asserts actionConfig is ActionConfig {
  assertType<ActionConfig>(actionConfig)
}


// DockerActionConfig

export interface DockerActionConfig extends ActionConfig {
  runs: {
    using: 'docker'
    'pre-entrypoint'?: string
    image: string
    env: {
      [key: string]: string
    }
    entrypoint?: string
    'post-entrypoint'?: string
    args?: string[]
  }
}

export function assertIsDockerActionConfig(dockerActionConfig: any): asserts dockerActionConfig is DockerActionConfig {
  assertType<DockerActionConfig>(dockerActionConfig)
}


// JavaScriptActionConfig

export interface JavaScriptActionConfig extends ActionConfig {
  runs: {
    using: 'node12'
    main: string
    pre?: string
    'pre-if'?: string
    post?: string
    'post-if'?: string
  }
}

export function assertIsJavaScriptActionConfig(javaScriptActionConfig: any): asserts javaScriptActionConfig is JavaScriptActionConfig {
  assertType<JavaScriptActionConfig>(javaScriptActionConfig)
}
