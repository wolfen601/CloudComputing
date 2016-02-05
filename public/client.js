document.addEventListener("DOMContentLoaded", function() {
   var mouse = {
      click: false,
      move: false,
      pos: {x:0, y:0},
      pos_prev: false
   };
   // get canvas element and create context
   var chatWndw  = document.getElementById('chat');
   var canvas  = document.getElementById('drawing');
   var context = canvas.getContext('2d');
   var messageWindow = document.getElementById('messageWindow');
   messageWindow.style.display = 'none';
   var canvasWidth   = window.innerWidth*(2/3) || 720;
   var canvasHeight  = 720;
   var chatWidth   = window.innerWidth*(1/3) || 240;
   var socket  = io.connect();

   //color picker
   var colorPicker = document.getElementById('colorpicker');
   var picked = false;
   var color = "#FF0000";

   //eraser
   var clear = document.getElementById('clear');
   var cleared = false;
   //save
   var save = document.getElementById('save');
   var saved = false;

   //login
   var login = document.getElementById('enter');
   var loginSuccess = false;
   var name = document.getElementById('name');
   var username = "";

   //chat
   var send = document.getElementById('send');
   var sent = false;

   //width/height
   canvas.width = canvasWidth;
   canvas.height = canvasHeight;
   chatWndw.width = chatWidth;

   //color
   context.lineWidth = 2;
   context.strokeStyle="#FF0000";

   // register mouse event handlers
   canvas.onmousedown = function(e){ mouse.click = true; };
   canvas.onmouseup = function(e){ mouse.click = false; };

   canvas.onmousemove = function(e) {
      // normalize mouse position to range 0.0 - 1.0
      mouse.pos.x = e.clientX / canvasWidth;
      mouse.pos.y = e.clientY / canvasHeight;
      mouse.move = true;
   };

   //ON CLICKS
   clear.onclick = function(){ cleared = true; };

   save.onclick = function() {
     saved = true;
     var canvas = document.getElementById("drawing");
     var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
     window.location.href=image;
   };

   colorPicker.onclick = function(){
     picked = true;
     var canvas  = document.getElementById('drawing');
     var context = canvas.getContext('2d');
     var randomColor;
     randomColor = Math.random() * 0x1000000; // 0 < randomColor < 0x1000000
     randomColor = Math.floor(randomColor); // 0 < randomColor <= 0xFFFFFF
     randomColor = randomColor.toString(16); // hex representation randomColor
     randomColor = ("000000" + randomColor).slice(-6); // leading zeros added
     randomColor = "#" + randomColor; // # added
     context.strokeStyle=randomColor;
     color = randomColor;
   };

   enter.onclick = function(){
     username = name.value;
     if(username == ""){
        alert("Name invalid");
     }else{
       loginSuccess = true;
     }
   };

   send.onclick = function(){ sent = true;};

   //SOCKETS

     // draw line received from server
  	socket.on('drawLine', function (data) {
        var line = data.line;
        context.beginPath();
        context.moveTo(line[0].x * canvasWidth, line[0].y * canvasHeight);
        context.lineTo(line[1].x * canvasWidth, line[1].y * canvasHeight);
        context.strokeStyle=line[2];
        context.stroke();
    });
    //clear screen
    socket.on('clear', function (data) {
      var canvas  = document.getElementById('drawing');
      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
    });
    //random color picker
    socket.on('colorPick', function (data) {
     var canvas  = document.getElementById('drawing');
     var context = canvas.getContext('2d');
     context.strokeStyle=data.id;
    });
    //new user
    socket.on('login', function(data){
      createMessage(0,data.id, "");
    });
    //show message
    socket.on('showMessage', function(data){
      createMessage(1,data.message[0], data.message[1]);
    });

    function createMessage(id, user, msg){
      //check if login or message
      if(id == 0){
        //login
        var chat = document.createElement("li");

        var newMsg = document.createElement("P");
        var bold = document.createElement("b");
        var text = document.createTextNode(user + " has logged in.");
        newMsg.appendChild(bold);
        newMsg.appendChild(text);
        chat.appendChild(newMsg);
        document.getElementById("chats").appendChild(chat);
      }else if(id == 1){
        //message
        var chat = document.createElement("li");

        var character = document.createElement("div");
        var bold = document.createElement("b");
        var chrName = document.createTextNode(user + " : ");
        character.appendChild(bold);
        character.appendChild(chrName);

        var newMsg = document.createElement("P");
        var text = document.createTextNode(" " + msg);
        newMsg.appendChild(text);

        chat.appendChild(character);
        chat.appendChild(newMsg);
        document.getElementById("chats").appendChild(chat);
      }
      $('#chatWindow').stop().animate({
        scrollTop: $("#chatWindow")[0].scrollHeight
      }, 800);
    }

   // main loop, running every 25ms
   function mainLoop() {

     if(cleared == true){
       cleared = false;
       socket.emit('clear', {id: 'clear'});
     }
     if(picked == true){
       picked = false;
       socket.emit('colorPick', {id: color});
     }
     if(saved == true){
       saved = false;
       socket.emit('save', {image: canvas.toDataURL("image/png")});
     }
     if(loginSuccess == true){
       loginSuccess = false;
       var messageWindow = document.getElementById('messageWindow');
       messageWindow.style.display = 'block';
       var loginScreen = document.getElementById('loginScreen');
       loginScreen.style.display = 'none';
       socket.emit('login', {id: username});
     }
     if(sent == true){
       sent = false;
       var messageContent = document.getElementById('message');
       var msg = messageContent.value;
       socket.emit('sendMessage', { message: [ username, msg ] });
     }
      // check if the user is drawing
      if (mouse.click && mouse.move && mouse.pos_prev) {
         // send line to to the server
         socket.emit('drawLine', { line: [ mouse.pos, mouse.pos_prev, color ] });
         mouse.move = false;
      }
      mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
      setTimeout(mainLoop, 25);
   }
   mainLoop();
});
