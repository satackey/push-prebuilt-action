
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
  getJavaScriptBuiltPath: Getter
  getJavaScriptOverrideMain: Getter // To compile own
}

export type UnionBuilderConfigGetters = DockerBuilderConfigGetters | JavaScriptBuilderConfigGetters
export type IntersectionBuilderConfigGetters = DockerBuilderConfigGetters & JavaScriptBuilderConfigGetters

export const defaultGetter: Getter = (required) => {
  if (required) {
    throw new Error('This is default getter.')
  }
  return ''
}

export const defaultConfigGetters: UnionBuilderConfigGetters = {
  getJavaScriptBuildCommand: defaultGetter,
  getDockerRegistry: defaultGetter,
  getDockerLoginUser: defaultGetter,
  getDockerLoginToken: defaultGetter,
  getDockerImageRepoTag: defaultGetter,
  getDockerBuildCommand: defaultGetter,
}

