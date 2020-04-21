import {
  ActionConfig, DockerActionConfig, JavaScriptActionConfig,
  assertIsActionConfig, // assertIsDockerActionConfig, assertIsJavaScriptActionConfig
} from './src/ActionConfig'

import { is } from 'typescript-is'

const tst:ActionConfig = {
  name: 'string',
  'author': 'string',
  description: 'string',
  inputs: {
    '[key: string]': {
      description: 'string',
      required: true,
      'default': 'string',
    }
  },
  outouts: {
    '[key: string]': {
      description: 'string',
    }
  },
  runs: {
    using: `docker`,
    '[key: string]': 'any',
  },
  branding: {
    icon: 'string',
    color: 'string',
  },
}


try {
  assertIsActionConfig(tst)
  console.log('ok tst')
} catch (e) {
  console.log('ng tst', e)
}
const tst2:any = {
  ...tst,
  name: true,
}

try {
  assertIsActionConfig(tst2)
  console.log('ok tst2')
} catch (e) {
  console.log('ng tst2', e)
}