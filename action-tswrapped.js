const { spawn } = require('child_process')

const run = () => new Promise((resolve, reject) => {
  const tsNode = spawn('yarn', ['ts-node', 'index.ts'], )

  tsNode.stdout.on('data', stdout => console.log(stdout.toString()))
  tsNode.stderr.on('data', stderr => console.log(stderr.toString()))
  
  tsNode.on('close', (code) => {
    if (code === 0) {
      return resolve()
    }

    console.log(`child process exited with code ${code}`)
    reject()
  })
})

const main = async () => {
  await run()
}



main().catch(e => {
  console.error(e)
  process.exit(1)
})
