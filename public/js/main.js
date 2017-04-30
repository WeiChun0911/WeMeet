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

//取得影片區的HTML元素
let localStream;
let localVideo = document.getElementById('localVideo');
let remoteVideo = {};

//取得文字區的HTML元素
let dataChannelSend = document.getElementById('dataChannelSend');
let dataChannelReceive = document.getElementById('dataChannelReceive');
let msgButton = document.querySelector('button#msgButton');

var fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', handleFileInputChange, false);
var downloadAnchor = document.getElementById('download');
var receiveBuffer = [];

// Attach event handlers
//在按鈕上，附加事件處理函數
msgButton.addEventListener('click', sendText);

// Create a random room if not already present in the URL.
//創建房間，如果沒有顯示在URL裡面
let isInitiator = false;
let isStarted = false;
//....chat.html 「 #/chat?name= 」 > 共12個位元 > 取自=以後的值
let room = window.location.hash.substring(12);

/****************************************************************************
 * Signaling server
 ****************************************************************************/

// Connect to the signaling server
//連線上私人通訊伺服器
let socket = io.connect("https://140.123.175.95:8787");
let localUserID;
let connections = {};
let remoteStream = {};
let fileChannels = {};
let msgChannels = {};

getUserMedia();
socket.emit('join', getRoom());


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
    console.log('收到遠端的 offer，要建立連線並處理');
    isInitiator = false;
    let peerConn = createPeerConnection(isInitiator, configuration, sender);
    peerConn.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
            return peerConn.createAnswer();
        })
        .then((answer) => {
            console.log('創建好本地端的 answer，要傳出去');
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

socket.on('participantLeft', function(participantID) {
    delete connections[participantID];
    delete remoteStream[participantID];
})

socket.on('videoFromDB', function(arrayBuffer) {
    console.log("Getting blob form DB and server!!");
    var blob = new Blob([arrayBuffer], { type: 'video/webm' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = localUserID + '.webm';
    a.click();
    window.URL.revokeObjectURL(url);
})

/****************************************************************************
 * WebRTC peer connection and data channel
 ****************************************************************************/
//取得使用者端的影像
function getUserMedia(argument) {
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
}

//建立點對點連線物件，以及為連線標的創建影像視窗
function createPeerConnection(isInitiator, config, remotePeer) {
    //For 李佳怡:
    //接到另外一個人加入房間的時候，會使用這個function
    //把他的video tag 創建好 render在畫面上的工作就交給你ㄌ
    //大概長得像下面的樣子
    var video = document.createElement('video');
    video.id = remotePeer;
    video.autoPlay = true;
    document.body.appendChild(video);
    remoteVideo[remotePeer] = video;

    let peerConn = new RTCPeerConnection(config);
    connections[remotePeer] = peerConn;
    if (localStream) {
        peerConn.addStream(localStream);
    }

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
        var fileChannel = peerConn.createDataChannel('files');
        var msgChannel = peerConn.createDataChannel('messages');
        fileChannels[remotePeer] = fileChannel;
        msgChannels[remotePeer] = msgChannel;

        //建立成功後，立即處理
        onDataChannelCreated(fileChannel);
        onDataChannelCreated(msgChannel);

        //開啟通道後，初始化HTML元素
        downloadAnchor.textContent = '';
        downloadAnchor.removeAttribute('download');
        if (downloadAnchor.href) {
            URL.revokeObjectURL(downloadAnchor.href);
            downloadAnchor.removeAttribute('href');
        }

    } else {
        //如果不是開房的，是加入別人的房間
        //如果有連線成功，會接到這個事件
        peerConn.ondatachannel = function(event) {
            console.log('ondatachannel:', event.channel.label);
            //加入別人建立的頻道
            if (event.channel.label == 'files') {
                //開啟通道後，初始化HTML元素
                downloadAnchor.textContent = '';
                downloadAnchor.removeAttribute('download');
                if (downloadAnchor.href) {
                    URL.revokeObjectURL(downloadAnchor.href);
                    downloadAnchor.removeAttribute('href');
                }
                var fileChannel = event.channel;
                fileChannels[remotePeer] = fileChannel;
                console.log('joined channel' + event.channel.label);
                onDataChannelCreated(fileChannel);
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
    channel.onmessage = function(event) {
        if (channel.label == 'files') {
            console.log(event.data);
            if (typeof event.data === 'string') {
                var data = JSON.parse(event.data);
                var received = new window.Blob(receiveBuffer);
                receiveBuffer = [];
                //downloadAnchor是一個HTML<a>
                downloadAnchor.href = URL.createObjectURL(received); //塞入BLOB檔案網址
                downloadAnchor.download = data.fileName; //下載後的檔案名稱
                //HTML<a>顯示的文字
                downloadAnchor.textContent = 'Click to download \'' + data.fileName + '\' (' + data.fileSize + ' bytes)';
                //傳好後把它顯示出來
                downloadAnchor.style.display = 'block';
            }
            receiveBuffer.push(event.data); //把資料push進陣列

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

function handleFileInputChange() {
    var file = fileInput.files[0];
    if (!file) {
        console.log('No file chosen');
    } else {
        sendFile();
    }
}

function closeDataChannels() {
    sendChannel.close();
    trace('Closed data channel with label: ' + sendChannel.label);
    if (receiveChannel) {
        receiveChannel.close();
        trace('Closed data channel with label: ' + receiveChannel.label);
    }
    localConnection.close();
    remoteConnection.close();
    localConnection = null;
    remoteConnection = null;
    trace('Closed peer connections');

    // re-enable the file select
    fileInput.disabled = false;
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

function sendFile() {
    //假設一次上船多個檔案，files[0]指的是第一個傳的檔案
    //這裡只做單一檔案上傳功能
    var file = fileInput.files[0];
    console.log('File is ' + [file.name, file.size, file.type, file.lastModifiedDate].join(', '));
    downloadAnchor.textContent = ''; //把下載的超連結內容改為空值

    var chunkSize = 16384;
    //切割檔案的function，並傳入起始點，從頭開始切
    var sliceFile = (offset) => {
        //讀取<input>中的檔案
        var reader = new window.FileReader();
        //讀取完成時觸發此函數
        reader.onload = (e) => {
            //把讀取好的檔案透過fileChannel傳送給遠端使用者
            for (var id in fileChannels) {
                //e.target.result是一個ArrayBuffer，長度為:16384bits，把他送給遠端使用者
                fileChannels[id].send(e.target.result);
                //如果檔案總大小>0+16384>再呼叫一次sliceFile(0+16384+16384+...)>遞迴
                if (file.size > offset + e.target.result.byteLength) {
                    window.setTimeout(sliceFile, 0, offset + chunkSize);
                } else {
                    fileChannels[id].send(JSON.stringify({
                        'fileName': file.name,
                        'fileSize': file.size,
                        'fileType': file.type
                    }))
                }
            }
        };
        //從檔案開頭，切一塊16384的檔案下來
        var slice = file.slice(offset, offset + chunkSize);
        reader.readAsArrayBuffer(slice);
    };
    sliceFile(0);
}

function randomToken() {
    return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}

function getRoom() {
    //如果網址上沒有房名，就是創建房間的人
    if (!room) {
        window.location.hash = '/chat?name=' + randomToken();
        room = randomToken();
    }
    return room;
}
