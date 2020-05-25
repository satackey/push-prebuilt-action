
export type Getter = (required: boolean) => string

export interface DockerBuilderConfigGetters {
  getDockerRegistry: Getter
  getDockerLoginUser: Getter
  getDockerLoginToken: Getter
  getDockerImageRepoTag: Getter
  getDockerBuildCommand: Getter
}

export interface JavaScriptBuilderConfigGetters {
  getJavaScriptBuildCommand: Getter
}

export type BuilderConfigGetters = DockerBuilderConfigGetters & JavaScriptBuilderConfigGetters 

export const defaultGetter: Getter = (required) => {
  if (required) {
    throw new Error('This is default getter.')
  }
  return ''
}

export const defaultConfigGetters: BuilderConfigGetters = {
  getJavaScriptBuildCommand: defaultGetter,
  getDockerRegistry: defaultGetter,
  getDockerLoginUser: defaultGetter,
  getDockerLoginToken: defaultGetter,
  getDockerImageRepoTag: defaultGetter,
  getDockerBuildCommand: defaultGetter,
}

