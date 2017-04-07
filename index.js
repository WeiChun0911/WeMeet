'use strict';

//回傳一個具有express的library的物件，當作處理request的Callback
const express = require('express');
const app = express();
const fs = require('fs');
//HTTPS參數
const option = {
    key: fs.readFileSync('./certificate/privatekey.pem'),
    cert: fs.readFileSync('./certificate/certificate.pem')
};
//對https Server內傳入express的處理物件
const server = require('https').createServer(option, app);
const io = require('socket.io')(server);
server.listen(8787);
console.log('已啟動伺服器!');

let counter = 0;
app.get('', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})
app.get('https://localhost:8787/chat.html', (req, res) => {
    res.sendFile(__dirname + '/chat.html');
})

app.use(express.static('./'));

io.on('connection', function(socket) {
    console.log("接收到使用者: " + socket.id + " 的連線");

    socket.on('join', function(room) {
        console.log('收到創建/加入房間: ' + room + ' 的請求');
        socket.join(room);
        console.log('Client ID ' + socket.id + ' joined room ' + room);
        socket.emit('joined', room, socket.id);
    });

    socket.on('newParticipant', function(msgSender, room) {
        socket.to(room).emit('newParticipant', msgSender);
    });

    socket.on('offerRemotePeer', function(offer, sender, receiver) {
        socket.to(receiver).emit('offer', offer, sender);
    });

    socket.on('answerRemotePeer', function(answer, sender, receiver) {
        socket.to(receiver).emit('answer', answer, sender);
    })

    socket.on('onIceCandidate', function(candidate, sender, receiver) {
        socket.to(receiver).emit('onIceCandidate', candidate, sender);
    })

    socket.on('bye', function() {
        console.log('received bye');
    });

});
