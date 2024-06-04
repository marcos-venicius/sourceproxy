const path = require('url')
const http = require('http')

function help() {
  console.log('usage: 0.0.0.0:4567-10.0.0.80:80')
  console.log('it means: proxy requests from 0.0.0.0:4567 to 10.0.0.80:80')
  process.exit(1)
}

function getValues(term = '') {
  const split = term.split('-')

  if (split.length !== 2) return help()

  const local = split[0].split(':')

  if (local.length !== 2) return help()

  const remote = split[1].split(':')

  if (remote.length !== 2) return help()

  return {
    localHost: local[0],
    localPort: local[1],
    remoteHost: remote[0],
    remotePort: remote[1]
  }
}

const args = process.argv.slice(2)

if (args.length === 0) {
  help()
}

const { localHost, localPort, remoteHost, remotePort } = getValues(args[0])

let currentIndex = 0

const queue = []

function logInfo(message) {
  console.log(`\x1b[1;36m[*]\x1b[0m ${message}`)
}

function logSuccess(message) {
  console.log(`\x1b[1;32m[+]\x1b[0m ${message}`)
}

async function handleQueue() {
  while (true) {
    while (currentIndex > queue.length -1 || queue.length === 0) {
      logInfo('waiting for request')
      await new Promise(r => setTimeout(r, 500))
    }

    const item = queue[currentIndex]

    logSuccess('handling request')

    await new Promise(resolve => {
      const request = item.request
      const response = item.response

      response.setHeader('Transfer-Encoding', 'chunked')

      const options = {
        hostname: remoteHost,
        port: Number(remotePort),
        path: request.url ?? "/",
        method: request.method,
        localAddress: localHost,
        localPort: Number(localPort),
        headers: {
          ...request.headers,
          host: `${remoteHost}:${remotePort}`,
          referer: path.resolve(`http://${remoteHost}`, request.url ?? "/") 
        }
      }

      const clientRequest = http.request({
        ...options
      }, function (res) {
        res.pipe(response)
        res.on("close", () => response.end())
      })

      clientRequest.addListener("close", () => resolve())
      clientRequest.addListener("finish", () => resolve())
      clientRequest.addListener("error", () => resolve())

      clientRequest.end()
    })

    logSuccess('request handled')
    logInfo('timing out')
    await new Promise(r => setTimeout(r, 1000))
    logInfo('going to next request in queue')

    currentIndex += 1
  }
}

http.createServer(async function (request, response) {
  queue.push({
    request,
    response
  })
}).listen(4040, () => {
  logSuccess(`Listening at 0.0.0.0:4040`)

  handleQueue()
})


