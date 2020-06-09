import path from 'path'
import { promises as fs } from 'fs'
import * as yaml from 'js-yaml'
import { is } from 'typescript-is'

import { ActionBuilder } from './ActionBuilder'
import { DockerActionBuilder } from './DockerActionBuilder/DockerActionBuilder'
import { JavaScriptActionBuilder } from './JavaScriptActionBuilder/JavaScriptActionBuilder'
import { assertIsActionConfig, ActionConfig, JavaScriptActionConfig, DockerActionConfig } from './ActionConfig'
import { IntersectionBuilderConfigGetters } from './ActionBuilderConfigGetters'

export const createBuilder = async (yamlDir: string, configGetters: IntersectionBuilderConfigGetters): Promise<ActionBuilder> => {

  const yamlFilePath = await findYamlFile(yamlDir)
  const actionConfig = await readYamlFileFrom(yamlFilePath)
  assertIsActionConfig(actionConfig)

  const builder = await createBuilderFrom(actionConfig, configGetters, yamlDir)
  builder.actionConfigPath = yamlFilePath

  return builder
}

const findYamlFile = async (yamlDir: string): Promise<string> => {
  const absoluteYamlDir = path.resolve(yamlDir)

  const yamlDirLs = await fs.readdir(absoluteYamlDir)
  const foundYamls = yamlDirLs.filter(dir => dir.endsWith('action.yaml') || dir.endsWith('action.yml'))

  if (foundYamls.length < 1) {
    throw new Error(`There is no action YAML file in ${absoluteYamlDir}`)
  }

  if (foundYamls.length > 1) {
    throw new Error(`action.yml and action.yaml was found in ${absoluteYamlDir}. Only one of them must be present.`)
  }

  return foundYamls[0]
}

const readYamlFileFrom = async (yamlPath: string): Promise<any> => {
  const readString = await fs.readFile(yamlPath, 'utf8')
  return yaml.safeLoad(readString, {
    filename: yamlPath,
  })
}

const createBuilderFrom = async (anActionConfig: ActionConfig, configGetters: IntersectionBuilderConfigGetters, yamlDir: string): Promise<ActionBuilder> => {
  if (is<JavaScriptActionConfig>(anActionConfig)) {
    return new JavaScriptActionBuilder(anActionConfig, configGetters, yamlDir)
  }

  if (is<DockerActionConfig>(anActionConfig)) {
    return new DockerActionBuilder(anActionConfig, configGetters, yamlDir)
  }

  throw new Error(`Unknown ActionConfig`)
}
