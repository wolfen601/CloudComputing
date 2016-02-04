document.addEventListener("DOMContentLoaded", function() {
   var mouse = {
      click: false,
      move: false,
      pos: {x:0, y:0},
      pos_prev: false
   };
   // get canvas element and create context
   var canvas  = document.getElementById('drawing');
   var context = canvas.getContext('2d');
   var width   = window.innerWidth-10;
   var height  = 720;
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

   // set canvas to full browser width/height
   canvas.width = width;
   canvas.height = height;
   canvas.style.border = '2px solid #73AD21;'

   //color
   context.lineWidth = 2;
   context.strokeStyle="#FF0000";

   // register mouse event handlers
   canvas.onmousedown = function(e){ mouse.click = true; };
   canvas.onmouseup = function(e){ mouse.click = false; };

   canvas.onmousemove = function(e) {
      // normalize mouse position to range 0.0 - 1.0
      mouse.pos.x = e.clientX / width;
      mouse.pos.y = e.clientY / height;
      mouse.move = true;
   };

   clear.onclick = function(){ cleared = true; };

   save.onclick = function() {
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
   }

   //SOCKETS

   // draw line received from server
	socket.on('draw_line', function (data) {
      var line = data.line;
      context.beginPath();
      context.moveTo(line[0].x * width, line[0].y * height);
      context.lineTo(line[1].x * width, line[1].y * height);
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
    socket.on('colorpick', function (data) {
       var canvas  = document.getElementById('drawing');
       var context = canvas.getContext('2d');
       context.strokeStyle=data.id;
     });

   // main loop, running every 25ms
   function mainLoop() {

     if(cleared == true){
       cleared = false;
       socket.emit('clear', {id: 'clear'});
     }
     if(picked == true){
       picked = false;
       socket.emit('colorpick', {id: color});
     }
      // check if the user is drawing
      if (mouse.click && mouse.move && mouse.pos_prev) {
         // send line to to the server
         socket.emit('draw_line', { line: [ mouse.pos, mouse.pos_prev, color ] });
         mouse.move = false;
      }
      mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
      setTimeout(mainLoop, 25);
   }
   mainLoop();
});
