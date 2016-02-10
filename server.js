/* Author: Kevin Ho
 * Server file
 * Handles communication with the storage service as well as emitting messages
 * to all clients.
*/
//initialize all the required libraries and connections
var express = require('express'),
    app = express(),
    http = require('http'),
    socketIo = require('socket.io'),
    aws = require('aws-sdk');
var server = http.createServer(app);
var io = socketIo.listen(server);
var port = process.env.PORT || 8080;
var accessKeyId =  process.env.AWS_ACCESS_KEY || "xxxxxx";
var secretAccessKey = process.env.AWS_SECRET_KEY || "xxxxxx";
var s3bucket = process.env.S3_BUCKET || "xx-xx-xx-xx";

//configure the aws account information to be used
aws.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
});
//set the desired s3 bucket to use
var s3 = new aws.S3({
      params: {Bucket: s3bucket}
});
//start the application
server.listen(port);
app.use(express.static(__dirname + '/public'));
console.log("Server running on 127.0.0.1:" + port);
//historical data and counter for image names
var lineHistory = [];
var messageHistory = [];
var counter = 0;
//on successful connection from client to server
io.on('connection', function (socket) {
  //on successful connection, redraw the canvase and resend the messages to the
  //new client
  for (var i in lineHistory) {
     socket.emit('drawLine', { line: lineHistory[i] } );
  }
  for (var i in messageHistory) {
     socket.emit('showMessage', { message: messageHistory[i] } );
  }
  //when server receives a draw operation, store in history and tell other
  //clients to draw
  socket.on('drawLine', function (data) {
     lineHistory.push(data.line);
     io.emit('drawLine', { line: data.line });
  });
  //on clear operation received, clear draw and message history and tell all
  //clients to erase canvas
  socket.on('clear', function(data){
    lineHistory = [];
    messageHistory = [];
    io.emit('clear', { id: data.id });
  });
  //on save operation, store the image buffer stream as an base64 encoded png
  //image to s3 with public read only access
  //file name : image[counter].png
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
  //on login detected, tell all clients that a new user has joined
  socket.on('login', function(data){
    io.emit('showMessage', { message: data.message } );
  });
  //on message send detected, send message to all clients
  socket.on('sendMessage', function(data){
    messageHistory.push(data.message);
    io.emit('showMessage', { message: data.message } );
  });
});
