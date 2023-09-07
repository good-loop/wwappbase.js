
// TODO
See WebSocketMain.java in webappbase
function startGameWS() {
	game.ws = new WebSocket('ws://localhost:8080/events/');
  
	// // Browser WebSockets have slightly different syntax than `ws`.
	// // Instead of EventEmitter syntax `on('open')`, you assign a callback
	// // to the `onopen` property.
	// game.ws.onopen = function() {
	//   document.querySelector('#send').disabled = false;
  
	//   document.querySelector('#send').addEventListener('click', function() {
	//     game.ws.send(document.querySelector('#message').value);
	//   });
	// };
  
	game.ws.onmessage = function(msg) {    
	  // document.querySelector('#messages').innerHTML = `<div>${msg.data}</div>`;
	  getUpdate2(msg.data);
	};
  
	setInterval(getUpdate, 100);
  }
  