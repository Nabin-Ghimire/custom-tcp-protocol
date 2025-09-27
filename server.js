import net from "node:net"
import { parse } from "node:path"


const clients = []
const server = net.createServer((socket) => {
  console.log("Connected Successfully")
  socket.write("Welcome to extended ChatApp/n")

  socket.setEncoding('utf-8') //sets encoding or format of language

  //Maintain state of user in socket
  socket.authenticated = false;
  socket.joined = false;
  socket.username = ''
  clients.push(socket);

  console.log(`Total connected clients: ${clients.length}`)

  // socket.write("Welcome to the Coders TCP Chat!\n")
  // socket.write("Type your message and press Enter to Broadcast.\n")

  socket.on("data", (chunk) => {
    //parse the message
    const parsedMessage = messageParser(chunk)
    if (!parsedMessage) {
      console.error("Invalid message format");
      return;
    }

    handleMessage(socket, parsedMessage)

  })

  socket.on("end", () => {
    console.log("check")
    const index = clients.indexOf(socket) //indexOf() fuction returns -1 if index of the given value is not found 
    console.log("check")
    if (index !== -1) {
      clients.splice(index, 1)
      console.log("check")
    }
    console.log("check")
    console.log("A client disconnected")
    console.log(`Total connected clients: ${clients.length}`)
  })

  socket.on("error", (err) => console.log("Error:", err))
})

server.listen(1137, () => console.log('Server listening on port 1137'))



function handleMessage(socket, parsedMessage) {
  switch (parsedMessage.command) {
    case 'AUTH':
      handleAuth(socket, parsedMessage);
      break;
    case 'JOIN':
      handleJoin(socket, parsedMessage);
      break;
  }
}


function handleAuth(socket, parsedMessage) {
  const user = parsedMessage.header['User']
  const token = parsedMessage.header['Token']

  //Todo: Move token to somewhere in db, and don't hard code
  if (user && token && token === 'secret123') {
    socket.authenticated = true;
    socket.user = user;

    socket.write(formatResponse("OK", "AUTH", { 'Content-Length': 0 }, '', user))
  }
}



function formatResponse(command, responseFor, headers, body, user) {

  //Response format

  /**
   * CHAT/1.0 OK
   * Response-For: AUTH/SEND/JOIN/LEAVE
   * USer:Alice
   * Content-Length:0
   */

  const startLine = `CHAT/1.0 ${command}`;
  const headerLines = [];
  headerLines.push(`Response-For: ${responseFor}`)
  if (user) {
    headerLines.push(`User: ${user}`)
  }
  for (const key in headers) {
    headerLines.push(`${key}: ${headers[key]}`)
  }

  return `${startLine}\r\n${headerLines.join('\r\n')}\r\n\r\n${body}`;

}

function messageParser(message) {

  //message from client
  //{CHAT/1.0 AUTH\r\nUser: 'Name'\r\nToken: 'Secret'\r\nContent-length:0\r\n\r\nbody }

  const parts = message.split('\r\n\r\n');
  if (parts.length < 2) return null; //Missing body

  const headerPart = parts[0];
  const body = parts[1];

  const headerLine = headerPart.split('\r\n')
  if (headerLine.length === 0) return null;

  const firstLine = headerLine[0].split(' ');
  if (firstLine.length < 2) return null;
  const protocolVersion = firstLine[0];
  const command = firstLine[1];

  const header = {}
  const contentLength = 0
  for (let i = 1; i < headerLine.length; i++) {
    const line = headerLine[i];

    const [key, value] = line.split(':');
    header[key.trim()] = value.trim();

    if (key.trim().toLowerCase() === 'content-length') {
      contentLength = parseInt(value.trim(), 10) //Base 10 means convert to decimal value

    }
  }

  //Optional Check

  if (body.length !== contentLength) {
    console.warn(`Warning: Body lenth ${body.length} does not match content length header`)
  }

  return { protocolVersion, command, header, body };

}