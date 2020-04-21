import { JavaScriptActionBuilder, DockerActionBuilder } from './ActionBuilders'

type CustomizedBuilder = DockerActionBuilder | JavaScriptActionBuilder

export const createBuilder = (yamlPath: string): CustomizedBuilder => {
  return new DockerActionBuilder('', '')
}
