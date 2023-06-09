var http = require('http'),
  WebSocketServer = require('ws').Server,
  port = 1234,
  host = '0.0.0.0';

// create a new HTTP server to deal with low level connection details (tcp connections, sockets, http handshakes, etc.)
var server = http.createServer();


// create a WebSocket Server on top of the HTTP server to deal with the WebSocket protocol
var wss = new WebSocketServer({
  server: server
});

// create a function to be able do broadcast messages to all WebSocket connected clients
wss.broadcast = function broadcast(message) {
  wss.clients.forEach(function each(client) {
    client.send(message);
  });
};

wss.binaryType = 'arraybuffer';

let history = [];

// Register a listener for new connections on the WebSocket.
wss.on('connection', function(client, request) {

  // retrieve the name in the cookies
  var cookies = request.headers.cookie.split(';');
  var wsname = cookies.find((c) => {
    return c.match(/^\s*wsname/) !== null;
  });
  wsname = wsname.split('=')[1];
  var lineColor = cookies.find((c) => {
    return c.match(/^\s*color/) !== null;
  });
  lineColor = lineColor.split("=")[1];
  wsname = wsname.split('=')[1];
  console.log("first connexion from", wsname, " with color ", lineColor);

  // greet the newly connected user
  client.send('Welcome, ' + decodeURIComponent(wsname) + '!');

  for(let i = 0; i < history.length; i++) {
    client.send(history[i]);
  }

  // Register a listener on each message of each connection
  client.on('message', function(message) {

    var cli = '[' + decodeURIComponent(wsname) + ']';
    console.log("message from", cli);
    // when receiving a message, broadcast it to all the connected clients
    history[history.length] = message;
    wss.broadcast(message);
  });
});


// http sever starts listening on given host and port.
server.listen(port, host, function() {
  console.log('Listening on ' + server.address().address + ':' + server.address().port);
});

process.on('SIGINT', function() {
  process.exit(0);
});