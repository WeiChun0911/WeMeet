'use strict';

let Chat = {
    createNew: (htmlObj) => {
        let Chat = {};
        let { msgChannelSend, msgButton, fileInput, downloadAnchor, sendToUser, sendToDB } = htmlObj;
        let remoteVideo = {};
        let receiveBuffer = [];
        let fileContainer = null;
        let msgContainer = '';
        let isInitiator = false;
        let localUserID;
        let connections = {};
        let localStream;
        let remoteStream = {};
        let fileChannels = {};
        let msgChannels = {};
        let room = window.location.hash.substring(12);

        let configuration = {
            'iceServers': [{
                'url': 'stun:stun.l.google.com:19302'
            }, {
                'url': 'stun:stun.services.mozilla.com'
            }]
        };

        let socket = io.connect("https://140.123.175.95:8787");

        //取得使用者端的影像
        Chat.getUserMedia = () => {
            navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                })
                .then((stream) => {
                    localStream = stream;
                    return stream;
                })
                .catch((e) => {
                    console.log('發生錯誤了看這裡:' + e);
                });
        };

        //建立點對點連線物件，以及為連線標的創建影像視窗
        Chat.addUser = (remoteUserVideoTag) => {
            remoteStream[remotePeer] = remoteUserVideoTag;
            createPeerConnection(isInitiator, config, remotePeer);
        };

        let createPeerConnection = (isInitiator, config, remotePeer) => {
            let peerConn = new RTCPeerConnection(config);
            connections[remotePeer] = peerConn;
            if (localStream) {
                peerConn.addStream(localStream);
            }

            // send any ice candidates to the other peer
            peerConn.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('local端找到ice candidate>要傳出去: ' + JSON.stringify(event.candidate));
                    socket.emit('onIceCandidate', event.candidate, localUserID, remotePeer);
                }
            };

            peerConn.onaddstream = (event) => {
                console.log('Remote stream added.');
                remoteVideo[remotePeer].srcObject = event.stream;
                remoteStream[remotePeer] = event.stream;
            };

            peerConn.onremovestream = (event) => {
                console.log('Remote stream removed. Event: ', event);
            };

            //如果是開啟P2P的人
            if (isInitiator) {
                console.log('Creating Data Channel');
                //建立資料傳送頻道、訊息傳送頻道
                let fileChannel = peerConn.createDataChannel('files');
                let msgChannel = peerConn.createDataChannel('messages');
                fileChannels[remotePeer] = fileChannel;
                msgChannels[remotePeer] = msgChannel;

                //建立成功後，立即處理
                onDataChannelCreated(fileChannel);
                onDataChannelCreated(msgChannel);

                //開啟通道後，初始化download物件
                downloadAnchor.textContent = '';
                downloadAnchor.removeAttribute('download');
                if (downloadAnchor.href) {
                    //停止連結的引用/作用
                    URL.revokeObjectURL(downloadAnchor.href);
                    downloadAnchor.removeAttribute('href');
                }
            } else {
                //如果不是開房的，是加入別人的房間
                //如果有連線成功，會接到這個事件
                peerConn.ondatachannel = (event) => {
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
                        let fileChannel = event.channel;
                        fileChannels[remotePeer] = fileChannel;
                        console.log('joined channel' + event.channel.label);
                        onDataChannelCreated(fileChannel);
                    } else if (event.channel.label == 'messages') {
                        let msgChannel = event.channel;
                        msgChannels[remotePeer] = msgChannel;
                        console.log('joined channel' + event.channel.label);
                        onDataChannelCreated(msgChannel);
                    }
                };
            }
            return peerConn;
        };

        //建立資料傳遞頻道後，立即處理的函數
        let onDataChannelCreated = (channel) => {
            channel.onopen = () => {
                console.log('channel: ' + channel.label + ' is now opened!!!');
            };
            channel.onmessage = (event) => {
                if (channel.label == 'files') {
                    console.log(event.data);
                    if (typeof event.data === 'string') {
                        let received = new window.Blob(receiveBuffer);
                        receiveBuffer = [];
                        fileContainer = URL.createObjectURL(received);
                    }
                    //把每個ArrayBuffer都存在同一個陣列裡
                    receiveBuffer.push(event.data); //把資料push進陣列
                } else if (channel.label == 'messages') {
                    msgContainer = event.data;
                }
            };
        };

        let sendText = () => {
            //取得現在時間
            let date = new Date();
            //自定義時間格式:Hour-Minute
            let formattedTime = date.getHours() + ':' + date.getMinutes();

            for (let id in msgChannels) {
                msgChannels[id].send(localUserID + '[' + formattedTime + ']: ' + msgChannelSend.value);
            }

            //把輸入框清空
            msgChannelSend.value = '';
        };
        msgButton.addEventListener('click', sendText);

        let sendFileToUser = () => {
            //這個功能是直接將檔案廣播給房內的人，沒有存進資料庫
            //假設一次上傳多個檔案，files[0]指的是第一個傳的檔案
            //這裡暫時只做單一檔案上傳功能
            //webrtc的data channel一次最多只能傳送16*1024Bytes的檔案
            let file = fileInput.files[0];
            console.log('File is ' + [file.name, file.size, file.type, file.lastModifiedDate].join(', '));
            downloadAnchor.textContent = ''; //把下載的物件初始化

            let chunkSize = 16384;
            //切割檔案的，並傳入起始點，從頭開始切
            let sliceFile = (offset) => {
                //讀取<input>中的檔案
                let reader = new window.FileReader();
                //讀取完成時觸發此函數
                reader.onload = (e) => {
                    //把讀取好的檔案透過fileChannel傳送給「所有」遠端使用者
                    for (let id in fileChannels) {
                        //e.target.result是一個ArrayBuffer，長度為:16384bytes，把他送給遠端使用者
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
                let slice = file.slice(offset, offset + chunkSize);
                reader.readAsArrayBuffer(slice);
            };
            sliceFile(0);
        };
        sendToUser.addEventListener('click', sendFileToUser);


        let sendFileToDB = () => {
            //假設一次上傳多個檔案，files[0]指的是第一個傳的檔案
            //這裡只做單一檔案上傳功能
            let file = fileInput.files[0];
            console.log('File is ' + [file.name, file.size, file.type, file.lastModifiedDate].join(', '));
            downloadAnchor.textContent = ''; //把下載的超連結內容改為空值
            let reader = new window.FileReader();
            reader.onload = (e) => {
                let xhr = new XMLHttpRequest();
                xhr.open("POST", "https://140.123.175.95:8787/api/db/create/photo", true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify({
                    id: localUserID,
                    data: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        };
        sendToDB.addEventListener('click', sendFileToDB);

        let randomToken = () => {
            return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(8);
        };

        let getRoom = () => {
            //如果網址上沒有房名，就是創建房間的人
            if (!room) {
                room = randomToken();
            }
            return room;
        };

        //加入房間訊息
        socket.on('joined', (room, clientID) => {
            console.log('This peer has joined room: ' + room + ' with client ID ' + clientID);
            localUserID = clientID;
            socket.emit('newParticipant', clientID, room);
        });

        socket.on('newParticipant', (participantID) => {
            console.log('收到新人加入的訊息');
            //接到新人加入的訊息時，檢查是否已有連線
            if (connections[participantID]) {
                console.log("Connections with" + participantID + "already exists");
                return;
            } else {
                //主動建立連線
                isInitiator = true;
                let peerConn = createPeerConnection(isInitiator, configuration, participantID);
                peerConn.createOffer()
                    .then((offer) => {
                        peerConn.setLocalDescription(offer);
                        socket.emit('offerRemotePeer', offer, localUserID, participantID);
                    })
                    .catch((e) => {
                        console.log('發生錯誤了看這裡: ' + e);
                    });
            }
        });

        socket.on('onIceCandidate', (candidate, sender) => {
            console.log('收到遠端的candidate，要加入: ' + JSON.stringify(candidate));
            connections[sender].addIceCandidate(new RTCIceCandidate(candidate))
                .catch((e) => {
                    console.log('發生錯誤了看這裡: ' + e);
                });
        });

        socket.on('offer', (offer, sender) => {
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
        });

        socket.on('answer', (answer, sender) => {
            console.log('answer' + JSON.stringify(answer));
            connections[sender].setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('participantLeft', (participantID) => {
            delete connections[participantID];
            delete remoteStream[participantID];
        });

        // socket.on('videoFromDB', (arrayBuffer) => {
        //     console.log("Getting blob form DB and server!!");
        //     let blob = new Blob([arrayBuffer], { type: 'video/webm' });
        //     let url = window.URL.createObjectURL(blob);
        //     let a = document.createElement("a");
        //     document.body.appendChild(a);
        //     a.style = "display: none";
        //     a.href = url;
        //     a.download = localUserID + '.webm';
        //     a.click();
        //     window.URL.revokeObjectURL(url);
        // })
        return Chat;
    }
};

module.exports = Chat;
