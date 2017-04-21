'use strict';

//回傳一個具有express的library的物件，當作處理request的Callback
const express = require('express');
const app = express();
const fs = require('fs');
//HTTPS參數
const option = {
    key: fs.readFileSync('./public/certificate/privatekey.pem'),
    cert: fs.readFileSync('./public/certificate/certificate.pem')
};

var connection = {};

//對https Server內傳入express的處理物件
const server = require('https').createServer(option, app);
const io = require('socket.io')(server);
server.listen(8787);
console.log('已啟動伺服器!');

let counter = 0;

app.get('', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
})

app.get('https://140.123.175.95:8787/public/chat.html', (req, res) => {
    res.sendFile(__dirname + '/public/chat.html');
})

app.get("/userName", (req, res) => {
    res.send({name:"李佳怡"});
})

app.get("/userStatus", (req, res) => {
    res.send({status:"上線中"});
})

app.get("/userImg", (req, res) => {
    res.sendFile(__dirname + '/public/src/je.jpg');
})

//沒有定義路徑，則接收到請求就執行這個函數
app.use(express.static(__dirname + '/public'));


io.on('connection', function(socket) {
    connection[socket.id] = socket;
    console.log("接收到使用者: " + socket.id + " 的連線");

    socket.on('create', function() {
        console.log('收到創建房間: ' + room + ' 的請求');
        socket.join(room);
        console.log('Client ID ' + socket.id + ' joined room ' + room);
        socket.emit('joined', room, socket.id);
    })

    socket.on('join', function(room) {
        console.log('收到「加入」房間: ' + room + ' 的請求');
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

    socket.on('disconnect', function() {
        console.log("使用者: " + socket.id + " 離開了");
        socket.broadcast.emit('participantLeft', socket.id);
    });

    socket.on('bye', function() {
        console.log('received bye');
    });

});
