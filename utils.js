/*
var http = require('http');
var obj = http.IncomingMessage
console.log(obj);
*/

var net = require('net');
var server = net.createServer(function (socket) {
  socket.setEncoding('utf8');
  socket.write('Echo server\r\n');
  socket.pipe(socket);
});
server.listen(1338, '127.0.0.1');
console.log('TCP Server running at http://127.0.0.1:1338/');

var client = net.connect({port: 1338},
    function() { //'connect' listener
  console.log('client connected');
  client.setEncoding('utf8');
  client.on('readable',function() {
    var chunk;
    while (null != (chunk = client.read())) {
      console.log(chunk);
    }
    
  });
  
  setTimeout(function () {
      client.write('Hello world!\r\n');
      console.log('Tried to write');
    }, 3000);
  
});
