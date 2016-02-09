var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io'),
    aws = require('aws-sdk');

var server = http.createServer(app);
var io = socketIo.listen(server);
var port = process.env.PORT || 8080;
var accessKeyId =  process.env.AWS_ACCESS_KEY || "xx";
var secretAccessKey = process.env.AWS_SECRET_KEY || "xx";
var s3bucket = process.env.S3_BUCKET || "kevichino-cloud-x";


aws.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
});
var s3 = new aws.S3({
      params: {Bucket: s3bucket}
});

server.listen(port);
app.use(express.static(__dirname + '/public'));
console.log("Server running on 127.0.0.1:" + port);

var lineHistory = [];
var messageHistory = [];
var counter = 0;

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
  socket.on('save', function(data){
    var params = {
      Key: "image" + counter + ".png",
      Body: new Buffer(data.image.replace(/^data:image\/\w+;base64,/, ""),'base64'),
      ContentEncoding: 'base64',
      ContentType: 'image/png',
      ACL: 'public-read'
    };
    s3.putObject(params, function(errBucket, dataBucket) {
      if (errBucket) {
        console.log("Error uploading data: ", errBucket);
      } else {
        console.log("Success uploading data: ", dataBucket);
      }
    });
    counter = counter + 1;
  });
  socket.on('colorPick', function(data){
    io.emit('colorPick', { id: data.id });
  });
  socket.on('login', function(data){
    socket.emit('showMessage', { message: data.message } );
  });
  socket.on('sendMessage', function(data){
    messageHistory.push(data.message);
    socket.emit('showMessage', { message: data.message } );
  });
});
