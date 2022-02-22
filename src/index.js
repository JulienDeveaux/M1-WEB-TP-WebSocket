import './index.css';
import nameGenerator from './name-generator';
import isDef from './is-def';



// Store/retrieve the name in/from a cookie.
const cookies = document.cookie.split(';');
console.log(cookies)
console.log(document.cookie);
let wsname = cookies.find(function(c) {
  if (c.match(/wsname/) !== null) return true;
  return false;
});
if (isDef(wsname)) {
  wsname = wsname.split('=')[1];
} else {
  wsname = nameGenerator();
  wsname = wsname.split('|')[0];
  document.cookie = "wsname=" + encodeURIComponent(wsname);
}
//Store/retrieve the color in/from a cookie.
let lineColor = cookies.find(function(c) {
  if (c.match(/color/) !== null) return true;
  return false;
});
if (isDef(lineColor)) {
  lineColor = lineColor.split('=')[1];
  lineColor = lineColor.replace("%23", "#");
} else {
  lineColor = nameGenerator();
  lineColor = lineColor.split('|')[1];
  document.cookie = "color=" + encodeURIComponent(lineColor);
}

// Set the name in the header
document.querySelector('header>p').textContent = decodeURIComponent(wsname);

// Create a WebSocket connection to the server
// const ws = new WebSocket("ws://" + window.location.host+ "/socket");
const ws = new WebSocket("ws://localhost:1234");

ws.binaryType = 'arraybuffer';

// We get notified once connected to the server
ws.onopen = (event) => {
  console.log("We are connected.");
};

// Listen to messages coming from the server. When it happens, for each coord create a line
ws.onmessage = (event) => {
  let buffer = new Int32Array(event.data, 0, 5*Int8Array.BYTES_PER_ELEMENT);
  let data = [];
  data[0] = buffer[0];
  data[1] = buffer[1];
  data[2] = buffer[2];
  data[3] = buffer[3];
  data[4] = buffer[4].toString(16);
  if(data[1] !== undefined) {
    let ctx = myCanva.getContext("2d");
    let rect = myCanva.getBoundingClientRect();
    let x = data[0] - rect.left;
    let y = data[1];
    let previousx = data[2] - rect.left;
    let previousy = data[3];
    ctx.beginPath();
    ctx.moveTo(previousx, previousy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#" + data[4];
    ctx.stroke();
  }
};

let myCanva = document.querySelector('canvas');
myCanva.addEventListener('mousemove', recordInput);
myCanva.addEventListener('mousedown', () => {isDown = true; previousxy = undefined;});
myCanva.addEventListener('mouseup', () => isDown = false);
let xy, previousxy, isDown = false;
let sendInput = {
  value: ""
}

//draw on the canva and records the input
function recordInput() {
  if(isDown) {
    let ctx = myCanva.getContext("2d");
    ctx.beginPath();
    xy = getMousePosition(window.event);
    if (previousxy === undefined)
      previousxy = xy;
    ctx.moveTo(previousxy[0], previousxy[1]);
    ctx.lineTo(xy[0], xy[1]);
    ctx.strokeStyle = lineColor;
    ctx.stroke();
    sendMessage(xy, previousxy);
    previousxy = xy;
  }
}

//get coord of mouse
function getMousePosition(event) {
  let rect = myCanva.getBoundingClientRect();
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;
  return [x, y]
}

// Retrieve the input element. Add listeners in order to send the content of the input when the "return" key is pressed.
function sendMessage(xy, previousxy) {
    if (xy !== "" && previousxy !== "") {
      // Send data through the WebSocket
      let buffer = new Int32Array(5*Int8Array.BYTES_PER_ELEMENT);
      buffer[0] = xy[0];
      buffer[1] = xy[1];
      buffer[2] = previousxy[0];
      buffer[3] = previousxy[1];

      let hexColor = parseInt(lineColor.replace(/^#/, ''), 16);
      buffer[4] = hexColor;

      sendInput.value = buffer.buffer;
      ws.send(sendInput.value);
      sendInput.value = '';
    }
}

