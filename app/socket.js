import socketIO from 'socket.io-client';

let io = socketIO();
let socket = io.connect('https://140.123.175.95.8787');

export default socket;

