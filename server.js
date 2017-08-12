"use strict";

//回傳一個具有express的library的物件，當作處理request的Callback
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(
    bodyParser.urlencoded({
        type: "image/*",
        extended: false,
        limit: "50mb"
    })
);
app.use(
    bodyParser.json({
        type: "application/*",
        limit: "50mb"
    })
);
app.use(
    bodyParser.text({
        type: "text/plain"
    })
);
const fs = require("fs");
//const db = require('./app/lib/db.js');

let roomList = [];
let userInRoom = {};
let onlineUser = {}; //在線用戶
// let fakeName = {};

//HTTPS參數
// const option = {
//     key: fs.readFileSync('./public/certificate/privatekey.pem'),
//     cert: fs.readFileSync('./public/certificate/certificate.pem')
// };

//對https Server內傳入express的處理物件
const server = require("http").createServer(app);
const io = require("socket.io")(server);
server.listen(8787);
console.log("已啟動伺服器!");

// app.get("/api/db/history", (req, res) => {
//     db.History.find({ "room": '#53ee66' }, (err, data) => {
//         if (err) console.log(err);
//         console.log(data);
//         res.send('有成功喔!');
//     });
// });

//資料庫「新增」部分
// app.post("/api/db/history", (req, res) => {
//     let { roomName, record } = req.body;
//     db.History.create({
//         room: roomName,
//         history: record
//     }, function(err, data) {
//         if (err) {
//             console.log(err);
//         } else {
//             res.send('新增成功^^');
//         }
//     });
// });

// app.post("/api/db/create/photo", (req, res) => {
//     db.Account.findOneAndUpdate({ username: 'change' }, { photo: req.body.data }, (err, data) => {
//         if (err) console.log(err);
//         console.log('photo success');
//     });
// });

// app.post("/api/db/save/video", (req, res) => {

// });

io.on("connection", function(socket) {
    console.log("有人連線囉~" + socket.id);
    socket.emit("setRoomList", roomList);

    //console.log("接收到使用者: " + socket.id + " 的連線");
    // console.log(typeof(socket.id));
    // socket.on('setFakeName', function(dick) {
    //     fakeName[socket.id] = dick;
    // })

    // socket.on('getFakeName', () => {
    //     socket.emit('onFakeName', fakeName);
    // })

    //0516 Update
    socket.on("OpenBrain", function(list) {
        socket.broadcast.emit("OpenBrainForAll", list);
    });

    socket.on("addAgenda", function(list) {
        socket.broadcast.emit("addAgendaForAll", list);
    });

    socket.on("deleteAgenda", function(list) {
        socket.broadcast.emit("deleteAgendaForAll", list);
    });

    socket.on("giveMeMySocketId", msg => {
        socket.emit("gotSocketID", socket.id);
    });

    socket.on("join", function(room) {
         //將使用者加入房間
        socket.join(room);

        console.log("有人加入房間囉" + socket.id)
        console.log(Object.keys(socket.rooms)[0])
        //將新的人廣播出去
        socket.emit("addParticipant", socket.id);
        socket.to(room).emit("addParticipant", socket.id);
        //console.log('收到「加入」房間: ' + room + ' 的請求');
        if (!roomList.includes(room)) {
            //將房間加入"房間"列表
            roomList.push(room);
            //console.log(roomList, '已經有加ㄌ喔!');
        }
        //將使用者加入"房間-使用者"列表中
        if (!userInRoom[room]) {
            //房間不存在
            userInRoom[room] = [socket.id];
            console.log(userInRoom[room])
        } else if (userInRoom[room] && userInRoom[room].includes(socket.id)) {
            //房間存在，但人不存在房間裡
            userInRoom[room].push(socket.id);
            console.log(userInRoom[room] + 456)
        }
    });

    // socket.on("leaveRoom", function() {
    //     console.log("有人離開房間囉~" + socket.id);
    //     //當使用者離開聊天室，就將他移出房間
    //     let room = Object.keys(socket.rooms)[0];
    //     //console.log('有人離開ㄌ', userInRoom[room])
    //     if (userInRoom[room].length>0) {
    //         //如果那間房存在，就從裡面把這個人移除
    //         userInRoom[room].splice(userInRoom[room].indexOf(socket.id), 1);
    //         io.in(room).emit("delParticipant", socket.id);
    //     }
    //     if (!userInRoom[room]) {
    //         //如果房間裏面都沒人了，就把房間刪掉
    //         roomList.splice(roomList.indexOf(room), 1);
    //         socket.emit("delRoom",room);
    //         socket.broadcast.emit("delRoom", room);
    //     }
    //     //將新的房間名單傳出去
    //     //socket.broadcast.emit('newRoom', roomList);
    //     //socket.emit('newRoom', roomList);
    //     //console.log('廣播房間名單囉!', roomList)

    //     //再使用者加入房間的時候，把把房內人員名單傳給使用者
    //     //socket.broadcast.emit('userList', userInRoom[room]);
    //     //socket.emit('userList', userInRoom[room]);

    //     socket.leave(room);
    //     //console.log('廣播使用者名單囉!', userInRoom[room])
    // });

    socket.on("newParticipantA", function(msgSender, room) {
        socket.to(room).emit("newParticipantB", msgSender);
    });

    socket.on("offerRemotePeer", function(offer, sender, receiver) {
        socket.to(receiver).emit("offer", offer, sender);
    });

    socket.on("answerRemotePeer", function(answer, sender, receiver) {
        socket.to(receiver).emit("answer", answer, sender);
    });

    socket.on("onIceCandidateA", function(candidate, sender, receiver) {
        socket.to(receiver).emit("onIceCandidateB", candidate, sender);
    });

    socket.on("disconnect", function() {
        console.log("有人斷線囉~" + socket.id);
        let room = Object.keys(socket.rooms)[0];
        //當使用者離開聊天室，就將他移出房間
        console.log(room);
        //console.log('有人離開ㄌ', userInRoom[room])
        if (userInRoom[room]) {
            //如果那間房存在，就從裡面把這個人移除
            userInRoom[room].splice(userInRoom[room].indexOf(socket.id), 1);
            console.log(123)
            io.to(room).emit("delParticipant", socket.id);
        } else {
            console.log("???")
            //如果房間裏面都沒人了，就把房間刪掉
            roomList.splice(roomList.indexOf(room), 1);
            socket.broadcast.emit("delRoom", room);
        }
        //將新的房間名單傳出去
        //socket.broadcast.emit('newRoom', roomList);
        //socket.emit('newRoom', roomList);
        //console.log('廣播房間名單囉!', roomList)

        //再使用者加入房間的時候，把把房內人員名單傳給使用者
        //socket.broadcast.emit('userList', userInRoom[room]);
        //socket.emit('userList', userInRoom[room]);

        socket.leave(room);
        //console.log('廣播使用者名單囉!', userInRoom[room])
    });

    socket.on("requestVideoFromUser", function(sender) {
        console.log("使用者:" + socket.id + "請求了他的錄影BLOB檔");
    });

    socket.on("history", function(_history, room) {
        console.log(_history);
        db.History.create(
            {
                room: room,
                history: _history
            },
            function(err, data) {
                if (err) {
                    console.log(err);
                }
            }
        );
    });

    socket.on("getHistory", room => {
        db.History.find(
            {
                room: room
            },
            function(err, data) {
                if (err) throw err;
                socket.emit("onHistoryResult", data);
            }
        );
    });
});

//沒有定義路徑，則接收到請求就執行這個函數
app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});
