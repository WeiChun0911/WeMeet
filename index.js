'use strict';

var os = require('os');
var socketIO = require('socket.io');
var https = require('https');
var fs = require('fs');
var nodeStatic = require('node-static');

//HTTPS參數
const option = {
    key: fs.readFileSync('./certificate/privatekey.pem'),
    cert: fs.readFileSync('./certificate/certificate.pem')
};

//靜態檔案伺服器
var file = new nodeStatic.Server();

//產生HTTPS伺服器
var rdmArray = getRandomArray(1, 5, 5);
var UserName = ["龍貓", "拉拉熊", "監獄兔", "布丁狗", "奶油獅"];
var counter = 0;

var app = https.createServer(option, (req, res) => {
    file.serve(req, res);
}).listen(8787);

var io = socketIO.listen(app);

function getRandom(minNum, maxNum) { //取得 minNum(最小值) ~ maxNum(最大值) 之間的亂數
    return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
}

function getRandomArray(minNum, maxNum, n) { //隨機產生不重覆的n個數字
    var rdmArray = [n]; //儲存產生的陣列
    for (var i = 0; i < n; i++) {
        var rdm = 0; //暫存的亂數
        do {
            var exist = false; //此亂數是否已存在
            rdm = getRandom(minNum, maxNum); //取得亂數
            //檢查亂數是否存在於陣列中，若存在則繼續回圈
            if (rdmArray.indexOf(rdm) != -1) exist = true;
        } while (exist); //產生沒出現過的亂數時離開迴圈
        rdmArray[i] = rdm;
    }
    return rdmArray;
}

io.sockets.on('connection', function(socket) {
    // convenience function to log server messages on the client
    function log() {
        var array = ['Server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    socket.on('message', function(message) {
        // for a real app, would be room-only (not broadcast)
        socket.broadcast.emit('message', message);
    });

    socket.on('create or join', function(room) {
        log('Received request to create or join room ' + room);

        var numClients = io.sockets.sockets.length;

        log('Room ' + room + ' now has ' + numClients + ' client(s)');

        if (numClients === 1) {
            socket.join(room);
            log('Client ID ' + socket.id + ' created room ' + room);
            socket.emit('created', room, UserName[rdmArray[counter++]]);

        } else if (numClients === 2) {
            log('Client ID ' + socket.id + ' joined room ' + room);
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room, UserName[rdmArray[counter++]]);
            io.sockets.in(room).emit('ready');
        } else { // max two clients
            socket.emit('full', room);
        }
    });

    socket.on('ipaddr', function() {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function(details) {
                if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
            });
        }
    });

    socket.on('bye', function() {
        console.log('received bye');
    });

});
