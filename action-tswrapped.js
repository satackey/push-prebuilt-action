const { spawn } = require('child_process')

const run = () => new Promise((resolve, reject) => {
  console.log(Object.create(process.env))

  const tsNode = spawn('yarn', ['ts-node', '-C', 'ttypescript', 'index.ts'], {
    env: Object.create(process.env)
  })

  tsNode.stdout.on('data', stdout => console.log(stdout.toString()))
  tsNode.stderr.on('data', stderr => console.log(stderr.toString()))
  
  tsNode.on('close', (code) => {
    console.log(`child process exited with code ${code}`)

    if (code === 0) {
      return resolve()
    }

    reject(code)
  })
})

const main = async () => {
  await run()
}



main().catch(e => {
  console.error(e)
  process.exit(1)
})
