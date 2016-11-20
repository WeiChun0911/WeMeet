'use strict';

/****************************************************************************
 * Initial setup，初始設定
 ****************************************************************************/
//建立RTCPeerConnection的設定
//STUN 伺服器只有提供一個簡單的功能，
//就是讓在 NAT 中的 client 獲取自己本身公開的 IP 位址與連接埠。
//因此使用公開的伺服器即可。

//如果直接連線都失敗了，則改以 TURN 伺服器作為中繼站，
//讓所有的資料都透過 TURN 伺服器來轉送。
//因此需要架設私人伺服器。
//使用Heroku雲端伺服器服務平台，暫時使用免費額度。

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
let remoteStream;
let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');

/*  For PhotoShooting & sending
let photo = document.getElementById('photo');
let photoContext = photo.getContext('2d');
let trail = document.getElementById('trail');
let snapBtn = document.getElementById('snap');
let sendBtn = document.getElementById('send');
let snapAndSendBtn = document.getElementById('snapAndSend');
*/

//取得文字區的HTML元素
let dataChannelSend = document.getElementById('dataChannelSend');
let dataChannelReceive = document.getElementById('dataChannelReceive');
let msgButton = document.querySelector('button#msgButton');
//擷取相片的解析度
let photoContextW;
let photoContextH;


let peerConn;
let photoChannel;
let msgChannel;


// Attach event handlers
//在按鈕上，附加事件處理函數

/* For PhotoShooting & sending
snapBtn.addEventListener('click', snapPhoto);
sendBtn.addEventListener('click', sendPhoto);
snapAndSendBtn.addEventListener('click', snapAndSend);
*/
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
let socket = io.connect();
let ID = 'default';

//IP位址訊息
socket.on('ipaddr', function(ipaddr) {
    console.log('Server IP address is: ' + ipaddr);
    updateRoomURL(ipaddr);
});

// Join a room
//傳送加入房間/創建房間的訊息給伺服器
socket.emit('create or join', room);

//房間創建訊息
socket.on('created', function(room, clientID) {
    console.log('Created room', room, '- my client ID is', clientID);
    isInitiator = true;
    ID = clientID;
});

//加入房間訊息
socket.on('joined', function(room, clientID) {
    console.log('This peer has joined room', room, 'with client ID', clientID);
    isInitiator = false;
    ID = clientID;
});

//房間滿人訊息
socket.on('full', function(room) {
    window.location.hash = '';
    window.location.reload();
});

//成功加入房間(目前最多為兩人)訊息
socket.on('ready', function() {
    console.log('Socket is ready');
});

//列印伺服器訊訊息
socket.on('log', function(array) {
    console.log.apply(console, array);
});

//接收到伺服器訊息
socket.on('message', function(message) {
    console.log('Client received message:', message);
    signalingMessageCallback(message);
});

//如果網址是localhost，就傳送ipaddr訊息給伺服器
if (location.hostname.match(/localhost|127\.0\.0/)) {
    socket.emit('ipaddr');
}

/**
 * Send message to signaling server
 */
//傳送訊息給伺服器
function sendMessage(message) {
    console.log('Client sending message: ', message);
    socket.emit('message', message);
}

/**
 * Updates URL on the page so that users can copy&paste it to their peers.
 */
function updateRoomURL(ipaddr) {
    var url;
    if (!ipaddr) {
        url = location.href;
    } else {
        url = location.protocol + '//' + ipaddr + ':8787/#' + room;
    }
    roomURL.innerHTML = url;
}

/****************************************************************************
 * User media (webcam)
 ****************************************************************************/
//取得使用者端的影像
console.log('Getting user media ...');
navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true
    })
    .then(gotStream)
    .catch(function(e) {
        console.log('發生錯誤了看這裡:' + e);
    });

function gotStream(stream) {
    window.stream = stream; // stream available to console
    localVideo.src = window.URL.createObjectURL(stream);
    localStream = stream;
    sendMessage('got user media');
    // localVideo.onloadedmetadata = function() {
    //     photo.width = photoContextW = localVideo.videoWidth;
    //     photo.height = photoContextH = localVideo.videoHeight;
    //     console.log('gotStream with with and height:', photoContextW, photoContextH);
    // };
    // show(snapBtn);
    if (isInitiator) {
        createPeerConnection(isInitiator, configuration
);
        peerConn.addStream(localStream);
        isStarted = true;
        console.log('Creating an offer');
        peerConn.createOffer(onLocalSessionCreated, logError);
    }
}

/****************************************************************************
 * WebRTC peer connection and data channel
 ****************************************************************************/

//信令機制的訊息交換
function signalingMessageCallback(message) {
    if (message === 'got user media') {
        createPeerConnection(isInitiator, configuration);
        peerConn.addStream(localStream);
        isStarted = true;
        if (isInitiator) {
            console.log('Creating an offer');
            peerConn.createOffer(onLocalSessionCreated, logError);
        }
    } else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) {
            createPeerConnection(isInitiator, configuration);
            peerConn.addStream(localStream);
            isStarted = true;
        }
        console.log('Got offer. Sending answer to peer.');
        peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
            logError);
        peerConn.createAnswer(onLocalSessionCreated, logError);

    } else if (message.type === 'answer') {
        console.log('Got answer.');
        peerConn.setRemoteDescription(new RTCSessionDescription(message), function() {},
            logError);

    } else if (message.type === 'candidate') {
        peerConn.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        }));

    } else if (message === 'bye') {
        handleRemoteHangup();
    }
}

//建立點對點連線
function createPeerConnection(isInitiator, config) {
    console.log('Creating Peer connection as initiator?', isInitiator, 'config:',
        config);
    peerConn = new RTCPeerConnection(config);

    // send any ice candidates to the other peer
    peerConn.onicecandidate = function(event) {
        console.log('獲取ICE候選伺服器事件: ', event);
        if (event.candidate) {
            sendMessage({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            });
        } else {
            console.log('End of candidates.');
        }
    };

    peerConn.onaddstream = function(event) {
        console.log('Remote stream added.');
        remoteVideo.src = window.URL.createObjectURL(event.stream);
        remoteStream = event.stream;
    };

    peerConn.onremovestream = function(event) {
        console.log('Remote stream removed. Event: ', event);
    };

    //如果是開房的人
    if (isInitiator) {
        console.log('Creating Data Channel');

        //建立資料傳送頻道、訊息傳送頻道
        photoChannel = peerConn.createDataChannel('photos');
        msgChannel = peerConn.createDataChannel('messages');

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
                photoChannel = event.channel;
                console.log('joined channel' + event.channel.label);
                onDataChannelCreated(photoChannel);
            } else if (event.channel.label == 'messages') {
                msgChannel = event.channel;
                onDataChannelCreated(msgChannel);
            }
        };
    }
}

//建立連線的事件處理
function onLocalSessionCreated(desc) {
    console.log('本地端設定檔產生完成事件:', desc);
    peerConn.setLocalDescription(desc, function() {
        console.log('傳送本地端設定檔:', peerConn.localDescription);
        sendMessage(peerConn.localDescription);
    }, logError);
}

//建立資料傳遞頻道後，立即處理的函數
function onDataChannelCreated(channel) {
    console.log('資料傳遞頻道已建立事件:', channel);

    channel.onopen = function() {
        console.log('channel: ' + channel.label + ' is now opened!!!');
    };

    if (channel.label == 'photos') {
        //頻道接收到訊息的時候，立即處理，分為chrome工廠與firefox工廠
        channel.onmessage = (adapter.browserDetails.browser === 'firefox') ?
            receiveDataFirefoxFactory() : receiveDataChromeFactory();
    } else if (channel.label == 'messages') {
        channel.onmessage = function() {
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
    isInitiator = false;
}

function stop() {
    isStarted = false;
    // isAudioMuted = false;
    // isVideoMuted = false;
    pc.close();
    pc = null;
}

//如果是在chrome環境下，頻道接收到訊息(channel.onmessage)
function receiveDataChromeFactory() {
    var buf, count;
    return function onmessage(event) {
        //傳送圖片時，第一個message為圖片的大小，event.data將會為一個描述圖片大小的字串
        if (typeof event.data === 'string') {
            //建立一個buffer，大小為第一個message內寫明的檔案大小，指定給window物件，作為全域使用
            buf = window.buf = new Uint8ClampedArray(parseInt(event.data));
            count = 0;
            console.log('準備接收從遠端傳送的圖片，大小:' + buf.byteLength + ' bytes');
            return;
        }
        var data = new Uint8ClampedArray(event.data);
        //把event.data的東西，塞入window.buf，從count的位置
        buf.set(data, count);

        count += data.byteLength;
        console.log('count: ' + count);

        if (count === buf.byteLength) {
            // we're done: all data chunks have been received
            console.log('Done. Rendering photo.');
            renderPhoto(buf);
        }
    };
}
//如果是在firefox環境下，頻道接收到訊息(channel.onmessage)
function receiveDataFirefoxFactory() {
    var count, total, parts;

    return function onmessage(event) {
        if (typeof event.data === 'string') {
            total = parseInt(event.data);
            parts = [];
            count = 0;
            console.log('Expecting a total of ' + total + ' bytes');
            return;
        }

        parts.push(event.data);
        count += event.data.size;
        console.log('Got ' + event.data.size + ' byte(s), ' + (total - count) +
            ' to go.');

        if (count === total) {
            console.log('Assembling payload');
            var buf = new Uint8ClampedArray(total);
            var compose = function(i, pos) {
                var reader = new FileReader();
                reader.onload = function() {
                    buf.set(new Uint8ClampedArray(this.result), pos);
                    if (i + 1 === parts.length) {
                        console.log('Done. Rendering photo.');
                        renderPhoto(buf);
                    } else {
                        compose(i + 1, pos + this.result.byteLength);
                    }
                };
                reader.readAsArrayBuffer(parts[i]);
            };
            compose(0, 0);
        }
    };
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
    let TextNode = document.createTextNode(dataChannelSend.value + ': [' + formattedTime + ']' + ID);
    //透過訊息頻道，發送純文字訊息
    msgChannel.send(ID + '[' + formattedTime + ']: ' + dataChannelSend.value);
    //把文字塞進<p></p>裡面
    pTag.appendChild(TextNode);
    //把包好的<p></p>塞進chatBox裡，作為發言者的紀錄
    dataChannelReceive.appendChild(pTag);
    //把輸入框清空
    dataChannelSend.value = '';
}

function snapPhoto() {
    photoContext.drawImage(localVideo, 0, 0, photo.width, photo.height);
    show(photo, sendBtn);
}

function sendPhoto() {
    // Split data channel message in chunks of this byte length.
    var CHUNK_LEN = 64000;
    console.log('width and height ', photoContextW, photoContextH);
    var img = photoContext.getImageData(0, 0, photoContextW, photoContextH),
        len = img.data.byteLength,
        n = len / CHUNK_LEN | 0;

    console.log('Sending a total of ' + len + ' byte(s)');
    photoChannel.send(len);

    // split the photo and send in chunks of about 64KB
    for (var i = 0; i < n; i++) {
        var start = i * CHUNK_LEN,
            end = (i + 1) * CHUNK_LEN;
        console.log(start + ' - ' + (end - 1));
        photoChannel.send(img.data.subarray(start, end));
    }

    // send the reminder, if any
    if (len % CHUNK_LEN) {
        console.log('last ' + len % CHUNK_LEN + ' byte(s)');
        photoChannel.send(img.data.subarray(n * CHUNK_LEN));
    }
}

function snapAndSend() {
    snapPhoto();
    sendPhoto();
}

function renderPhoto(data) {
    var canvas = document.createElement('canvas');
    canvas.width = photoContextW;
    canvas.height = photoContextH;
    canvas.classList.add('incomingPhoto');
    // trail is the element holding the incoming images
    trail.insertBefore(canvas, trail.firstChild);

    var context = canvas.getContext('2d');
    var img = context.createImageData(photoContextW, photoContextH);
    img.data.set(data);
    context.putImageData(img, 0, 0);
}

function show() {
    Array.prototype.forEach.call(arguments, function(elem) {
        elem.style.display = null;
    });
}

function hide() {
    Array.prototype.forEach.call(arguments, function(elem) {
        elem.style.display = 'none';
    });
}

function randomToken() {
    return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}

function logError(err) {
    console.log(err.toString(), err);
}
