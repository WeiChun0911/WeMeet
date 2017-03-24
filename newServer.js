'use strict';
/*
1.本伺服器作為 End-User 與 KMS (Kurento Media Server) 之間的橋樑
2.架構如下:
[Webpage-User] -- websocket 1 -- [Server.js] -- websocket2 -- [KMS]
[Phone-User]   -- websocket 1 -- [Server.js] -- websocket2 -- [KMS]
...

3.伺服器功能範圍:
    A.UserSession(資料格式定義) & UserRegistry(功能)
    B.Room(資料格式定義) & RoomManager(功能) 
    C.CallHandler
    D.KurentoClient
    E.WebSocketHandler
*/


var path = require('path');
var url = require('url');
var cookieParser = require('cookie-parser')
var session = require('express-session')
var minimist = require('minimist');
var ws = require('ws');
var kurento = require('kurento-client');
//kurento(), 會回傳一個物件,裡面有許多function.
var fs = require('fs'); //用來讀寫檔案(For Https keys)
var https = require('https');



//引入express套件，並運行。
var express = require('express');
//express()，會回傳一個function，設計來傳給Node Server(HTTP or HTTPS)，
//作為一個callback來處理requests。
var app = express();

var argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: 'https://140.123.175.95:8443',
        ws_uri: 'ws://140.123.175.95:8888/kurento'
    }
});

var options = {
    key: fs.readFileSync('certificate/privatekey.pem'),
    cert: fs.readFileSync('certificate/certificate.pem')
};

/****************************************
 *     Management of Server CallBack    *
 ****************************************/
app.use(cookieParser());

var sessionHandler = session({
    secret: 'none',
    rolling: true,
    resave: true,
    saveUninitialized: true
});

app.use(sessionHandler);

app.use(express.static(path.join(__dirname + '/public')));
/****************************************
 *    Definition of global variables.   *
 ****************************************/
var sessions = {};
var candidatesQueue = {};
var kurentoClient = null;

/****************************************
 *             Server startup           *
 ****************************************/
var asUrl = url.parse(argv.as_uri);
var port = asUrl.port;
var server = https.createServer(options, app).listen(port, function() {
    console.log('The Server is running!');
    console.log('Check out ' + url.format(asUrl));
});

var wss = new ws.Server({
    server: server,
    path: '/groupcall'
});

/******************************************
 *    Management of WebSocket messages    *
 ******************************************/
var connections = {};

wss.on('connection', function(ws) {

    var sessionId = null;
    var request = ws.upgradeReq;
    var response = {
        writeHead: {}
    };

    sessionHandler(request, response, function(error) {
        sessionId = request.session.id;
        connections[sessionId] = ws;
        console.log('收到這位使用者的連線: ' + sessionId);
    });

    ws.on('error', (error) => {
        console.log('Connection ' + sessionId + ' error');
        stop(sessionId);
    });

    //對方關閉連線時，收到訊息
    ws.on('close', () => {
        console.log('Connection ' + sessionId + ' closed');
        stop(sessionId);
    });

    ws.onmessage = (event) => {
        var message = JSON.parse(event.data);
        console.log('收到從這位使用者: ' + sessionId + ' 發出的訊息: ' + event.data);
        switch (message.id) {
            case "receiveVideoFrom":
                var senderName = message.sender;
                var sender = registry.getUserByName(senderName);
                var sdpOffer = message.sdpOffer;
                //傳訊息來的人(原本在房間裡面的人)，發出影像請求給sender(新加入的人)
                registry.getUserBySession(sessionId).receiveVideoFrom(sender, sdpOffer);
                break;

            case 'stop':
                stop(sessionId);
                break;

            case "joinRoom":
                joinRoom(message, sessionId);
                break;

            case "leaveRoom":
                leaveRoom(registry.getUserBySession(sessionId));
                break;

            case "onIceCandidate":
                var candidate = kurento.getComplexType('IceCandidate')(message.candidate);
                if (registry.getUserBySession(session)) {
                    var cand = new IceCandidate(candidate.candidate, candidate.sdpMid, candidate.sdpMLineIndex);
                    registry.getUserBySession(session).addCandidate(cand, message.sender);
                }
                break;
            default:
                ws.send(JSON.stringify({
                    id: 'error',
                    message: 'Invalid message ' + message
                }));
                break;
        }
    }
});
/***************************************
 *        A1.  UserSession Part        *
 ***************************************/
var UserSession = {
    create: function(_name, _roomName, _sessionId, _pipeline, callback) {
        //var log = LoggerFactory.getLogger(UserSession.class);
        var userSession = {};
        var incomingMedia = {};
        var name = _name;
        var roomName = _roomName;
        var sessionId = _sessionId;
        var pipeline = _pipeline;
        var outgoingMedia = null;

        userSession.getOutgoingWebRtcPeer = function() {
            return outgoingMedia;
        }
        userSession.getName = function() {
            return name;
        }
        userSession.getSession = function() {
            return sessionId;
        }
        userSession.getPipeline = function() {
                return pipeline;
            }
            /*
                The room to which the user is currently attending.   
                return The room
            */

        userSession.getRoomName = function() {
            return roomName;
        }

        //原本在房內的人接收到新人加入的事件後(newParticipantArrived)，所發出的影像請求，
        //找到新人(sender)物件，並將請求處理(processOffer)後，回傳答案給原本在房內的人
        userSession.receiveVideoFrom = function(sender, sdpOffer) {
            console.log("USER: " + name + " => connecting with " + sender.getName() + " in room: " + roomName);
            //console.log("USER: " + name + " => 發出的 SdpOffer for " + sender.getName() + " is " + sdpOffer);
            console.log("User: " + name + " 向使用者 : " + sender.getName() + "請求影像!");

            if (sender.getName() == name) {
                console.log("PARTICIPANT: " + name + " => is configuring loopback");
                outgoingMedia.processOffer(sdpOffer, function(error, sdpAnswer) {
                    if (error) {
                        pipeline.release();
                        return callback(error);
                    }
                    console.log("已處理sdp要求並產生回應: " + sdpAnswer);
                    console.log("Sender: " + sender.getName() + " 的SdpAnswer: " + JSON.stringify(sdpAnswer));
                    var scParams = {
                        "id": "receiveVideoAnswer",
                        "name": sender.getName(),
                        "sdpAnswer": sdpAnswer
                    };

                    //把Answer回傳給Sender
                    userSession.sendMessage(scParams);
                    console.log("gather candidates");
                    outgoingMedia.gatherCandidates();
                });
            } else if (incomingMedia[sender.getName()] == undefined) {
                console.log("PARTICIPANT: " + name + " creating new endpoint for " + sender.getName());
                //視作一個在本地端的Sender的分身，專門用來接收Sender的影像
                createMediaElements(sender.getPipeline(), connections[sender.getSession()], sender.getName(), function(webRtcEndpoint) {
                    let incoming = webRtcEndpoint;
                    console.log("已取得webRtcEndpoint");
                    incomingMedia[sender.getName()] = incoming;
                    //把sender傳出影像的endpoint與
                    //原使用者這邊替新人創造的incomingEndpoint連結在一起
                    //    原使用者的網頁     新人的網頁
                    //    自己的outgoing |  新人的outgoing       
                    //    自己的incoming |  新人的incoming
                    //    (裡面有很多endpoint是用來接收別人的影像的)
                    //這邊將原使用者將自己的incoming Endpoint連結上 新人的outgoing Endpoint
                    sender.getOutgoingWebRtcPeer().connect(incoming, function(error) {
                        if (error) {
                            pipeline.release();
                            console.error(error);
                        }
                    });
                    incoming.processOffer(sdpOffer, function(error, sdpAnswer) {
                        if (error) {
                            pipeline.release();
                            return callback(error);
                        }
                        console.log("已處理sdp要求並產生回應: " + sdpAnswer);
                        console.log("Sender: " + sender.getName() + " 的SdpAnswer: " + JSON.stringify(sdpAnswer));
                        var scParams = {
                            "id": "receiveVideoAnswer",
                            "name": sender.getName(),
                            "sdpAnswer": sdpAnswer
                        };
                        //把Answer回傳給Sender
                        userSession.sendMessage(scParams);
                        console.log("gather candidates");
                        incoming.gatherCandidates();
                    });
                });
            } else {
                let incoming = incomingMedia[sender.getName()];
                sender.getOutgoingWebRtcPeer().connect(incoming, function(error) {
                    if (error) {
                        pipeline.release();
                        console.error(error);
                    }
                });
                incoming.processOffer(sdpOffer, function(error, sdpAnswer) {
                    if (error) {
                        pipeline.release();
                        return callback(error);
                    }
                    console.log("已處理sdp要求並產生回應: " + sdpAnswer);
                    console.log("Sender: " + sender.getName() + " 的SdpAnswer: " + JSON.stringify(sdpAnswer));
                    var scParams = {
                        "id": "receiveVideoAnswer",
                        "name": sender.getName(),
                        "sdpAnswer": sdpAnswer
                    };

                    //把Answer回傳給Sender
                    userSession.sendMessage(scParams);
                    console.log("gather candidates");
                    incoming.gatherCandidates();
                });;
            }
        }
        userSession.cancelVideoFrom = function(senderName) {
            console.log("PARTICIPANT: " + name + " is canceling video reception from: " + senderName);
            var incoming = incomingMedia[senderName];

            console.log("PARTICIPANT: " + name + " is removing endpoint for: " + senderName);
            incoming.release({
                "onSuccess": function onSuccess(result) {
                    console.log("PARTICIPANT" + name + "Released successfully incoming EP for" + senderName);
                },
                "onError": function onError(cause) {
                    console.log("PARTICIPANT" + name + "Could not release incoming EP for" + senderName);
                }
            });
        }

        userSession.close = function() {
            console.log("PARTICIPANT: " + name + " ,Releasing resources");
            for (var remoteParticipantName in incomingMedia) {
                console.log("PARTICIPANT: " + name + " ,Released incoming EP for " + remoteParticipantName);
                var ep = incomingMedia.remoteParticipantName;
                ep.release({
                    "onSuccess": function onSuccess(result) {
                        console.log("PARTICIPANT: " + name + " ,Released successfully incoming EP for " + remoteParticipantName);
                    },
                    "onError": function onError(cause) {
                        console.log("PARTICIPANT: " + name + " ,Could not release incoming EP for " + remoteParticipantName);
                    }
                });
            }

            outgoingMedia.release({
                "onSuccess": function onSuccess(result) {
                    console.log("PARTICIPANT: " + name + " ,Released outgoing EP");
                },
                "onError": function onError(cause) {
                    console.log("USER: " + name + " ,Could not release outgoing EP");
                }
            });
        }

        userSession.sendMessage = function(message) {
            console.log("Sending message: " + JSON.stringify(message) + " to USER: " + name);
            connections[sessionId].send(JSON.stringify(message));
        }

        userSession.addCandidate = function(candidate, name) {
            if (userSession.name == name) {
                outgoingMedia.addIceCandidate(candidate);
            } else {
                var webRtc = incomingMedia.name;
                if (webRtc != null) {
                    webRtc.addIceCandidate(candidate);
                }
            }
        }

        /*
         * (non-Javadoc)
         *
         * @see java.lang.Object#equals(java.lang.Object)
         */
        // userSession.equals = function(obj) {
        //     if (userSession == obj) {
        //         return true;
        //     }
        //     if (obj == null) {
        //         return false;
        //     }
        //     var other = obj;
        //     var eq = name.equals(other.name);
        //     eq = roomName.equals(other.roomName);
        //     return eq;
        // }

        /*
         * (non-Javadoc)
         *
         * @see java.lang.Object#hashCode()
         */
        // userSession.hashCode = function() {
        //     var result = 1;
        //     result = 31 * result + name.hashCode();
        //     result = 31 * result + roomName.hashCode();
        //     return result;
        // };

        //一個UserSession物件，創建一個Endpoint物件
        createMediaElements(pipeline, connections[sessionId], name, function(webRtcEndpoint) {
            outgoingMedia = webRtcEndpoint;
            console.log("已取得webRtcEndpoint");
            return callback(userSession);
        });
    }　　
};
/***************************************
 *        A2.  UserRegistry Part        *
 ***************************************/
var UserRegistry = {
    create: function() {　　　　
        var registry = {};
        var usersBySessionId = {};
        var usersByName = {};
        registry.register = function(user) {
            var userSession = user.getSession();
            var name = user.getName();
            usersBySessionId[userSession] = user;
            usersByName[name] = user;
        }
        registry.getUserByName = function(name) {
            return usersByName[name];
        }
        registry.getUserBySession = function(session) {
            return usersBySessionId[session];
        }　　　　　　　　　　
        return registry;　　　　
    }　　
};
var registry = UserRegistry.create();

/***************************************
 *           B1.  Room Part            *
 ***************************************/
var Room = {
    create: function(_roomName) {
        var room = {};
        var roomName = _roomName;
        var participants = {};
        room.getName = function() {
            return roomName;
        }
        var shutdown = function() {
                room = null;
            }
            //新增使用者資料(名稱(人的名稱)、房名(屬於哪個房間)、
            //以及該使用者的WebSocket的sessionId(才能傳訊息給特定使用者)
        room.addParticipant = function(_userName, _sessionId) {
            if (registry.getUserBySession(_sessionId) == null) {
                console.log("找不到該使用者的Endpoint，正在創造中");
                getKurentoClient(function(error, kurentoClient) {
                    if (error) {
                        return callback(error);
                    }
                    kurentoClient.create('MediaPipeline', function(error, pipeline) {
                        if (error) {
                            return callback(error);
                        }
                        UserSession.create(_userName, roomName, _sessionId, pipeline, function(_userSession) {
                            registry.register(_userSession);
                            console.log("完成創造該使用者的Endpoint，並將使用者加入註冊名單");
                            var participant = _userSession;
                            join(participant);
                            participants[_userName] = participant;
                            room.sendParticipantNames(participant);
                            console.log("已將使用者加入房間");
                        });

                    });
                });
            } else {
                var participant = registry.getUserBySession(_sessionId);
                join(participant);
                participants[_userName] = participant;
                room.sendParticipantNames(participant);
                console.log("已將使用者加入房間");
            }
        }
        room.leave = function(user) {
            console.log("PARTICIPANT: " + user.getName() + " is Leaving room: " + roomName);
            removeParticipant(user.getName());
            user = null;
        }

        var join = function(newParticipant) {
            var newParticipantMsg = {
                id: "newParticipantArrived",
                name: newParticipant.getName()
            };
            console.log("ROOM: " + roomName + " => Notifying other participants of new participant: " + newParticipant.getName());
            var participants = room.getParticipants();
            for (var participantName in participants) {
                try {
                    console.log("正在向使用者:" + participants[participantName].getName() + "傳送新人加入的訊息")
                    participants[participantName].sendMessage(newParticipantMsg);
                } catch (error) {
                    console.log("房間: " + roomName + " ，使用者: " + participantName + " 無法辨識: " + error);
                }
            }
            console.log("房間: " + roomName + " ，已向所有房間內的成員寄出提醒!");
        }
        var removeParticipant = function(_name) {
                delete participants[_name];
                console.log("房間: " + roomName + " => Notifying all users that " + _name + " is leaving the room");
                var unnotifiedParticipants = [];
                var participantLeftJson = {
                    "id": "participantLeft",
                    "name": _name
                };
                for (var participantName in participants) {
                    try {
                        participants[participantName].cancelVideoFrom(_name);
                        participants[participantName].sendMessage(participantLeftJson);
                    } catch (error) {
                        console.log(error);
                        unnotifiedParticipants.push(participantName);
                    }
                }
                if (unnotifiedParticipants) {
                    console.log("Room: " + roomName + " => The users " + unnotifiedParticipants + " could not be notified that " + roomName + " left the room");
                }
            }
            //向新加入的使用者寄出已存在的使用者名單
        room.sendParticipantNames = function(user) {
            var participantsArray = [];
            var participants = room.getParticipants();
            for (var participantName in participants) {
                if (participants[participantName] !== user) {
                    participantsArray.push(participantName);
                }
            }
            var existingParticipantsMsg = {
                "id": "existingParticipants",
                "data": participantsArray
            };
            console.log("正在向使用者: " + user.getName() + " 發送房內成員的名單，長度為: " + participantsArray.length);
            user.sendMessage(existingParticipantsMsg);
        }
        room.getParticipants = function() {
            return participants;
        }
        room.getParticipant = function(_name) {
            return participants.find(_name);
        }
        room.close = function() {
            Object.keys(participants).forEach(function(participantName) {
                try {
                    participantName.close();
                } catch (error) {
                    console.log("Room: " + name + " => Could not invoke close on participant: " + user.getName() + e);
                }
            });
            participants = null;
            // pipeline.release({
            //     "onSuccess": function onSuccess(result) {
            //         console.log("Room : " + room + " => Released Pipeline");
            //     },
            //     "onError": function onError(cause) {
            //         console.log("PARTICIPANT: " + name + " => Could not release Pipeline");
            //     }
            // });
            console.log("Room: " + name + " => closed");
        }
        return room;
    }
};
var room;
/***************************************
 *        B2.  RoomManager Part        *
 ***************************************/
var RoomManager = {
    create: function() {
        var roomManager = {};
        var roomList = {};
        roomManager.getRoom = function(roomName, cb) {
            console.log("正在尋找房間: " + roomName);
            if (roomList[roomName] == null) {
                console.log("房間: " + roomName + " 不存在，正在創建中");
                var newRoom = Room.create(roomName);
                roomList[roomName] = newRoom;
                console.log("房間: " + roomName + " 已完成創建");
                cb(newRoom);
            } else {
                console.log("房間: " + roomName + " 存在，正在回傳中");
                cb(roomList[roomName]);
            }
        }
        roomManager.removeRoom = function(room) {
            delete roomList[room.getName()];
            room.close();
            console.log("Room: " + room.getName() + " is removed and closed");
        }
        return roomManager;
    }
}
var roomManager = RoomManager.create();

/***************************************
 *     Function Definition Part        *
 ***************************************/
// recover kurentoClient for the first time.
/*  use kurento(ws_uri, options, callback)
    from null to an defined object(class):
    KurentoClient {
        domain: null,
        _events: { disconnect: [Function] },
        _eventsCount: 1,
        _maxListeners: undefined,
        beginTransaction: [Function: bound ],
        endTransaction: [Function: bound ],
        transaction: [Function: bound ],
        getMediaobjectById: [Function],
        create: [Function: bound ],
        close: [Function],
        then: [Function],
        catch: [Function: bound ] 
    }
*/
function getKurentoClient(callback) {
    console.log("開始取得KurentoClient工具中");
    if (kurentoClient !== null) {
        return callback(null, kurentoClient);
    }
    kurento(argv.ws_uri, function(error, _kurentoClient) {
        if (error) {
            var message = 'Coult not find media server at address ' + argv.ws_uri;
            return callback(message + ". Exiting with error " + error);
        }
        kurentoClient = _kurentoClient;
        console.log("已取得KurentoClient工具");
        callback(null, kurentoClient);
    });
}

function createMediaElements(pipeline, ws, name, callback) {
    console.log("正在創造WebRtcEndpoint!");
    pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
        if (error) {
            pipeline.release();
            console.error(error);
        }
        //如果此userSession物件，有候選人，就把它全部加入
        if (candidatesQueue[ws.sessionId]) {
            while (candidatesQueue[ws.sessionId].length) {
                var candidate = candidatesQueue[ws.sessionId].shift();
                webRtcEndpoint.addIceCandidate(candidate);
            }
        }
        //如果此userSession物件，接收到候選人，就把資料傳到該userSession物件的前端(網頁)
        webRtcEndpoint.on('OnIceCandidate', function(event) {
            var candidate = kurento.getComplexType('IceCandidate')(event.candidate);
            ws.send(JSON.stringify({
                id: 'iceCandidate',
                name: name,
                candidate: candidate
            }));
        });
        return callback(webRtcEndpoint);
    });
}

function stop(sessionId) {
    if (sessions[sessionId]) {
        var pipeline = sessions[sessionId].pipeline;
        console.info('Releasing pipeline');
        pipeline.release();
        delete sessions[sessionId];
        delete candidatesQueue[sessionId];
    }
}

function joinRoom(params, _sessionId) {
    var roomName = params.room;
    var userName = params.name;
    console.log("使用者: " + userName + " 正在加入房間: " + roomName);
    roomManager.getRoom(roomName, function(room) {
        room.addParticipant(userName, _sessionId);
    });
}

function leaveRoom(user) {
    roomManager.getRoom(user.getRoomName(), function(room) {
        room.leave(user);
        if (Object.keys(room.getParticipants()).length === 0) {
            roomManager.removeRoom(room);
        }
    });
}
