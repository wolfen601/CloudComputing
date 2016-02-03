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
   var width   = 720;
   var height  = 720;
   var socket  = io.connect();

   var eraser = document.getElementById('erase');
   var erased = false;

   var save = document.getElementById('save');
   var saved = false;

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

   eraser.onclick = function(){ erased = true; };

   save.onclick = function() {
     alert('hello');
     var canvas = document.getElementById("drawing");
     var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
     window.location.href=image;
   };

   // draw line received from server
	socket.on('draw_line', function (data) {
      var line = data.line;
      context.beginPath();
      context.moveTo(line[0].x * width, line[0].y * height);
      context.lineTo(line[1].x * width, line[1].y * height);
      context.stroke();
   });

   socket.on('erase', function (data) {
      var canvas  = document.getElementById('drawing');
      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
    });

   // main loop, running every 25ms
   function mainLoop() {

     if(erased == true){
       erased = false;
       socket.emit('erase', {id: 'erase'});
     }

      // check if the user is drawing
      if (mouse.click && mouse.move && mouse.pos_prev) {
         // send line to to the server
         socket.emit('draw_line', { line: [ mouse.pos, mouse.pos_prev ] });
         mouse.move = false;
      }
      mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
      setTimeout(mainLoop, 25);
   }
   mainLoop();
});
