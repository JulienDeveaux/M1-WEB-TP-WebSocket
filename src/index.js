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

// We get notified once connected to the server
ws.onopen = (event) => {
  console.log("We are connected.");
};

// Listen to messages coming from the server. When it happens, for each coord create a line
ws.onmessage = (event) => {
  let data = event.data.split("][");
  if(data[1] !== undefined) {
    let ctx = myCanva.getContext("2d");
    let posLine = data[1].split(",");
    let beforePos = data[2].split(",");
    ctx.beginPath();
    ctx.moveTo(beforePos[0], beforePos[1]);
    ctx.lineTo(posLine[0], posLine[1]);
    ctx.strokeStyle = data[3].slice(0, -1);
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
    sendInput.value = sendInput.value + JSON.stringify(xy) + JSON.stringify(previousxy) + "[" + lineColor + "]";
    ctx.strokeStyle = lineColor;
    ctx.stroke();
    previousxy = xy;
    sendMessage(true);
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
function sendMessage(event) {
    if (sendInput.value !== '') {
      // Send data through the WebSocket
      ws.send(sendInput.value);
      sendInput.value = '';
    }
}

