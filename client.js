import readline from 'node:readline/promises'
import net from 'node:net'

const HOST = 'localhost'
const PORT = 1137

async function startChat() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '>'
  })

  //Open a TCP Connection
  const client = net.createConnection({
    host: HOST,
    port: PORT
  }, () => {
    // console.log("Connected to the Server")
  })


  //Get Username

  const username = await rl.question('Enter username: ')

  //Get Token

  const token = await rl.question('Enter Password:')

  //Prepare Auth Command
  const authCommand = buildCommand('AUTH', { User: username, Token: token, 'constent-length': 0 }, '')

  client.write(authCommand)
  console.log('Data sent')




  client.on('data', (data) => {
    console.log('Received', data.toString())
  })

}

function buildCommand(command, headers, body) {

  //Format of message
  // CHAT/1.0 AUTH
  // User: 'Name',
  // Token: 'Secret',
  // Content-length:0

  // body 

  const startLine = `CHAR/1.0 ${command}`
  const headerLines = []
  for (const key in headers) {
    const header = `${key}:${headers[key]}`
    headerLines.push(header)
  }
  return `${startLine}\r\n${headerLines.join('\r\n')}\r\n\r\n${body}`
}

startChat()




