'use strict';

//回傳一個具有express的library的物件，當作處理request的Callback
const express = require('express');
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.urlencoded({ type: 'image/*', extended: false, limit: '50mb' }));
app.use(bodyParser.json({ type: 'application/*', limit: '50mb' }));
app.use(bodyParser.text({ type: 'text/*' }));
const fs = require('fs');
const db = require('./db.js');
let connection = {};

//HTTPS參數
const option = {
    key: fs.readFileSync('./public/certificate/privatekey.pem'),
    cert: fs.readFileSync('./public/certificate/certificate.pem')
};

//對https Server內傳入express的處理物件
const server = require('https').createServer(option, app);
const io = require('socket.io')(server);
server.listen(8787);
console.log('已啟動伺服器!');


app.get('', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
})

app.get('https://140.123.175.95:8787/public/chat.html', (req, res) => {
    res.sendFile(__dirname + '/public/chat.html');
})


//資料庫「查詢」部分
app.get("/api/db/read/account", (req, res) => {
    db.Account.find({}, function(err, data) {
        if (err) throw err;
        res.send(data);
    })
})
app.get("/api/db/read/onlineList", (req, res) => {
    db.OnlineList.find({}, function(err, data) {
        if (err) throw err;
        res.send(data);
    })
})
app.get("/api/db/read/meetingList", (req, res) => {
    db.MeetingList.find({}, function(err, data) {
        if (err) throw err;
        res.send(data);
    })
})
app.get("/api/db/read/sourceList", (req, res) => {
    db.SourceList.find({}, function(err, data) {
        if (err) throw err;
        res.send(data);
    })
})

//資料庫「新增」部分
app.post("/api/db/create/register", (req, res) => {
    var { username, password, name, birthday, email, registerTime } = req.body;
    db.Account.create({
        username: username,
        password: password,
        name: name,
        birthday: birthday,
        email: email,
        registerTime: registerTime
    }, function(err, data) {
        if (err) console.log(err);
        console.log(data);
    });
})

app.post("/api/db/create/photo", (req, res) => {
    db.Account.findOneAndUpdate({ username: 'change' }, { photo: req.body.data }, (err, data) => {
        if (err) console.log(err);
        console.log('photo success');
    });
})

app.get("/api/db/test", (req, res) => {
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

    socket.on('videoToDB', function(blob) {
        console.log(`使用者: ${socket.id} 請求將其錄影檔案: ${blob} 傳進資料庫`);
        //資料庫處理的部分
    })

    socket.on('requestVideoFromUser', function(sender) {
        console.log('使用者:' + socket.id + '請求了他的錄影BLOB檔');
    })

    socket.on('bye', function() {
        console.log('received bye');
    });

});
