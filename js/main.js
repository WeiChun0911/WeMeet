'use strict';

/****************************************************************************
 * Initial setup，初始設定
 ****************************************************************************/
//建立RTCPeerConnection的設定
//STUN 伺服器只有提供一個簡單的功能，
//就是讓在 NAT 中的 client 獲取自己本身公開的 IP 位址與連接埠。
//因此使用公開的STUN伺服器即可。

//如果直接連線都失敗了，則改以 TURN 伺服器作為中繼站，
//讓所有的資料都透過 TURN 伺服器來轉送。
//因此需要架設私人伺服器。

let configuration = {
    'iceServers': [{
        'url': 'stun:stun.l.google.com:19302'
    }, {
        'url': 'stun:stun.services.mozilla.com'
    }]
};

let roomURL = document.getElementById('url');

//取得影片區的HTML元素
let localStream;
let remoteStream = {};
let localVideo = document.getElementById('localVideo');
let remoteVideo = {};

//取得文字區的HTML元素
let dataChannelSend = document.getElementById('dataChannelSend');
let dataChannelReceive = document.getElementById('dataChannelReceive');
let msgButton = document.querySelector('button#msgButton');
//擷取相片的解析度
let photoContextW;
let photoContextH;

// Attach event handlers
//在按鈕上，附加事件處理函數
msgButton.addEventListener('click', sendText);

// Create a random room if not already present in the URL.
//創建房間，如果沒有顯示在URL裡面
let isInitiator = false;
let isStarted = false;
let room = window.location.hash.substring(1);
if (!room) {
    room = window.location.hash = randomToken();
}

/****************************************************************************
 * Signaling server
 ****************************************************************************/

// Connect to the signaling server
//連線上私人通訊伺服器
let socket = io.connect("https://localhost:8787");
let localUserID;
let connections = {};
let photoChannels = {};
let msgChannels = {};

//取得使用者端的影像


navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    })
    .then(function(stream) {
        window.stream = stream;
        localVideo.srcObject = stream;
        localStream = stream;
        console.log('已取得使用者影像');
    })
    .catch(function(e) {
        console.log('發生錯誤了看這裡:' + e);
    });

socket.emit('join', room);

//加入房間訊息
socket.on('joined', function(room, clientID) {
    console.log('This peer has joined room: ' + room + ' with client ID ' + clientID);
    localUserID = clientID;
    socket.emit('newParticipant', clientID, room);
});

socket.on('newParticipant', function(participantID) {
    console.log('收到新人加入的訊息');
    //接到新人加入的訊息時，檢查是否已有連線
    if (connections[participantID]) {
        console.log("Connections with" + participantID + "already exists");
        return;
    } else {
        //主動建立連線
        isInitiator = true;
        var peerConn = createPeerConnection(isInitiator, configuration, participantID);
        peerConn.createOffer()
            .then(function(offer) {
                peerConn.setLocalDescription(offer);
                socket.emit('offerRemotePeer', offer, localUserID, participantID)
            })
            .catch(function(e) {
                console.log('發生錯誤了看這裡: ' + e);
            });
    }
});

socket.on('onIceCandidate', function(candidate, sender) {
    console.log('收到遠端的candidate，要加入: ' + JSON.stringify(candidate));
    connections[sender].addIceCandidate(new RTCIceCandidate(candidate))
        .catch((e) => {
            console.log('發生錯誤了看這裡: ' + e);
        });
});

socket.on('offer', function(offer, sender) {
    console.log('收到遠端的 offer，要建立連線並處理: ' + JSON.stringify(offer));
    isInitiator = false;
    let peerConn = createPeerConnection(isInitiator, configuration, sender);
    peerConn.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
            return peerConn.createAnswer();
        })
        .then((answer) => {
            console.log('創建好本地端的 answer，要傳出去: ' + JSON.stringify(answer));
            peerConn.setLocalDescription(answer);
            socket.emit('answerRemotePeer', answer, localUserID, sender);
        })
        .catch((e) => {
            console.log('發生錯誤了看這裡:' + e);
        });
})

socket.on('answer', function(answer, sender) {
    console.log('answer' + JSON.stringify(answer));
    connections[sender].setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('bye', function() {
    handleRemoteHangup();
})

/****************************************************************************
 * WebRTC peer connection and data channel
 ****************************************************************************/
//建立點對點連線
function createPeerConnection(isInitiator, config, remotePeer) {
    var video = document.createElement('video');
    video.id = remotePeer;
    video.autoPlay = true;
    document.body.appendChild(video);
    remoteVideo[remotePeer] = video;

    let peerConn = new RTCPeerConnection(config);
    connections[remotePeer] = peerConn;
    peerConn.addStream(localStream);

    // send any ice candidates to the other peer
    peerConn.onicecandidate = function(event) {
        if (event.candidate) {
            console.log('local端找到ice candidate>要傳出去: ' + JSON.stringify(event.candidate));
            socket.emit('onIceCandidate', event.candidate, localUserID, remotePeer);
        } else {
            console.log('End of candidates.');
        }
    };

    peerConn.onaddstream = function(event) {
        console.log('Remote stream added.');
        remoteVideo[remotePeer].srcObject = event.stream;
        remoteStream[remotePeer] = event.stream;
    };

    peerConn.onremovestream = function(event) {
        console.log('Remote stream removed. Event: ', event);
    };

    //如果是開啟P2P的人
    if (isInitiator) {
        console.log('Creating Data Channel');
        //建立資料傳送頻道、訊息傳送頻道
        var photoChannel = peerConn.createDataChannel('photos');
        var msgChannel = peerConn.createDataChannel('messages');
        photoChannels[remotePeer] = photoChannel;
        msgChannels[remotePeer] = msgChannel;

        //建立成功後，立即處理
        onDataChannelCreated(photoChannel);
        onDataChannelCreated(msgChannel);
    } else {
        //如果不是開房的，是加入別人的房間
        //如果有連線成功，會接到這個事件
        peerConn.ondatachannel = function(event) {
            console.log('ondatachannel:', event.channel.label);
            //加入別人建立的頻道
            if (event.channel.label == 'photos') {
                var photoChannel = event.channel;
                photoChannels[remotePeer] = photoChannel;
                console.log('joined channel' + event.channel.label);
                onDataChannelCreated(photoChannel);
            } else if (event.channel.label == 'messages') {
                var msgChannel = event.channel;
                msgChannels[remotePeer] = msgChannel;
                console.log('joined channel' + event.channel.label);
                onDataChannelCreated(msgChannel);
            }
        };
    }
    return peerConn;
}

//建立資料傳遞頻道後，立即處理的函數
function onDataChannelCreated(channel) {
    channel.onopen = function() {
        console.log('channel: ' + channel.label + ' is now opened!!!');
    };
    channel.onmessage = function() {
        if (channel.label == 'photos') {
            //暫不做事
        } else if (channel.label == 'messages') {
            //取得接收到的文字
            let TextNode = document.createTextNode(event.data);
            let pTag = document.createElement("p");
            //把文字塞進<p></p>裡面
            pTag.appendChild(TextNode);
            //把包好的<p></p>塞進chatBox裡，作為接收者的紀錄
            dataChannelReceive.appendChild(pTag);
        }
    }
}

function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
}

function stop() {
    isStarted = false;
    // isAudioMuted = false;
    // isVideoMuted = false;
    pc.close();
    pc = null;
}

/****************************************************************************
 * Aux functions, mostly UI-related
 ****************************************************************************/
function sendText() {
    let pTag = document.createElement("p");
    let align = document.createAttribute("align");
    //發送者的文字靠右，方便辨識
    align.value = "right";
    pTag.setAttributeNode(align);
    //取得現在時間
    let date = new Date();
    //自定義時間格式:Hour-Minute
    let formattedTime = date.getHours() + ':' + date.getMinutes();
    let TextNode = document.createTextNode(dataChannelSend.value + ': [' + formattedTime + ']' + localUserID);
    //透過訊息頻道，發送純文字訊息
    for (var id in msgChannels) {
        msgChannels[id].send(localUserID + '[' + formattedTime + ']: ' + dataChannelSend.value);
    }
    //把文字塞進<p></p>裡面
    pTag.appendChild(TextNode);
    //把包好的<p></p>塞進chatBox裡，作為發言者的紀錄
    dataChannelReceive.appendChild(pTag);
    //把輸入框清空
    dataChannelSend.value = '';
}

function randomToken() {
    return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}
