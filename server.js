var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io');

var server = http.createServer(app);
var io = socketIo.listen(server);
var port = process.env.PORT || 8080;
server.listen(port);
app.use(express.static(__dirname + '/public'));
console.log("Server running on 127.0.0.1:" + port);

var lineHistory = [];
var messageHistory = [];

io.on('connection', function (socket) {
  for (var i in lineHistory) {
     socket.emit('drawLine', { line: lineHistory[i] } );
  }
  for (var i in messageHistory) {
     socket.emit('showMessage', { message: messageHistory[i] } );
  }
  socket.on('drawLine', function (data) {
     lineHistory.push(data.line);
     io.emit('drawLine', { line: data.line });
  });
  socket.on('clear', function(data){
    lineHistory = [];
    messageHistory = [];
    io.emit('clear', { id: data.id });
  });
  socket.on('colorPick', function(data){
    io.emit('colorPick', { id: data.id });
  });
  socket.on('login', function(data){
    socket.username = data.id;
    socket.emit('login', { id: data.id } );
  });
  socket.on('sendMessage', function(data){
    messageHistory.push(data.message);
    socket.emit('showMessage', { message: data.message } );
  });
});
