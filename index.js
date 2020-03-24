const core = require('@actions/core')
const exec = require('@actions/exec')
const fs = require('fs')
const yaml = require('js-yaml')
const rimraf = require('rimraf')

const exists = path => {
  try {
    fs.statSync(`${process.cwd()}/${path}`);
    return true
  } catch (e) {
    if (!e.message.includes('no such file or directory')) {
      throw e
    }

    return false
  }
}

const execAsync = async (command, args, options) => {
  let stdout = ''
  let stderr = ''

  const exitCode = await exec.exec(command, args, {
    listeners: {
      stdout: data => {
        stdout += data.toString()
      },
      stderr(data) {
        stdout += data.toString()
      },
    },
    ...options,
  })

  return {
    exitCode,
    stdout,
    stderr,
  }
}

const configureGit = async () => {
  core.startGroup('git config')
  await execAsync('git config --global user.name github-actions')
  await execAsync('git config --global user.email actions@github.com')
  core.endGroup()
}

const installNcc = async () => {
  core.startGroup('npm install -g @zeit/ncc')
  await execAsync('npm install -g @zeit/ncc')
  core.endGroup()
}

const installWithNpm = async () => {
  core.startGroup('npm install')
  await execAsync('npm install')
  core.endGroup()
}

const installWithNpmStrictly = async () => {
  core.startGroup('npm ci')
  await execAsync('npm ci')
  core.endGroup()
}

const installWithYarnStrictly = async () => {
  core.startGroup('yarn install --frozen-lockfile --non-interactive')
  await execAsync('yarn install --frozen-lockfile --non-interactive')
  core.endGroup()
}

const installDependencies = async () => {
  const log = (file, pkg ,level='info') => `${level}: ${file} found. Install dependencies with ${pkg}.`

  if (!exists('package.json')) {
    throw new Error('error: package.json not found.')
  }

  if (exists('package-lock.json')) {
    console.log(log('package-lock.json', 'npm'))
    await installWithNpmStrictly()
    return
  }

  if (exists('yarn.lock')) {
    console.log(log('yarn.lock', 'yarn'))
    await installWithYarnStrictly()
    return
  }

  console.warn(log('package-lock.json or yarn.lock not', 'npm', 'warn'))
  await installWithNpm()
}

const buildAction = async () => {
  const readActionConfig = () => {
    let path = ''
  
    if (exists('action.yml')) {
      path = 'action.yml'
    } else if (exists('action.yaml')) {
      path = 'action.yaml'
    } else {
      throw new Error('error: action.yml or action.yaml not found.')
    }
  
    const actionConfig = yaml.safeLoad(fs.readFileSync(path, 'utf8'))
  
    return {
      path, actionConfig
    }
  }
  
  const getMainFileFrom = actionConfig => {
    if (actionConfig == null || actionConfig.runs == null){
      throw new Error(`error: Key run.main doesn't exist.`)
    }
  
    if (typeof actionConfig.runs.main !== 'string'){
      throw new Error(`error: run.main is ${typeof actionConfig.runs.main}, not string.`)
    }
  
    return actionConfig.runs.main
  }
  
  const build = async file => {
    const dist = 'dist/index.js'
    core.startGroup('ncc build')
    await execAsync(`ncc build ${file} -o ${dist}`)
    return dist
  }
  
  const save = (config, saveAs) => {
    const yamlText = yaml.dump(config)
    fs.writeFileSync(saveAs, yamlText, 'utf8')
  }

  const { actionConfig, path } = readActionConfig()
  const mainfile = await getMainFileFrom(actionConfig)
  actionConfig.runs.main = await build(mainfile)
  save(actionConfig, path)

  return path
}

const clean = configPath => {
  core.startGroup('clean files')
  const ls = fs.readdirSync('.')
  const leaves = ['.git', 'dist', configPath]
  const toBeRemoved = ls.filter(path => !leaves.includes(path))
  console.log({ ls, leaves, toBeRemoved })
  toBeRemoved.forEach(path => rimraf.sync(path))
  core.endGroup()
}

const push = async (branch, tags) => {
  // git checkout -b release-${GITHUB_REF#refs/heads/}
  // git add .
  // git commit -m "[auto]"
  // git push -f -u origin release-${GITHUB_REF#refs/heads/}

  core.startGroup('git')
  await execAsync('git checkout -b ', [branch])
  await execAsync('git add .')
  await execAsync('git commit -m [auto]')
  console.log(tags)
  if (tags.length > 0) {
    await execAsync('git tag', tags)
  }
  await execAsync('git push -f -u origin', [branch, '--follow-tags'])
  core.endGroup()
}

const main = async () => {
  // const ref = core.getInput('ref', { required: true })

  // // refs/heads/master → master
  // const branch = ref.split('/').slice(-1)[0]

  const releaseBranch = core.getInput('release-branch', { required: true })

  const tags = typeof core.getInput('release-tags') === 'string' && core.getInput('release-tags').length > 0
    ? [] : core.getInput('release-tags').split(' ')

  await configureGit()
  await installNcc()
  await installDependencies()
  const configPath = await buildAction()
  clean(configPath)
  await push(releaseBranch, tags)
}

main().catch(e => {
  core.setFailed(e.message || JSON.stringify(e))
})
