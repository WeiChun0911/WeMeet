'use strict';

let Chat = {
    createNew: (MeetingActions, MeetingStore) => {
        let localStream = '';
        let fileChannels = {};
        let msgChannels = {};
        let localUserID = '';
        //取得使用者端的影像
        Chat.getUserMedia = (id, room, socket) => {
            localUserID = id;
            navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: { frameRate: { min: 24 } }
                })
                .then((stream) => {
                    if (stream.getVideoTracks().length > 0 && stream.getAudioTracks().length > 0) {
                        console.log('有影像而且有聲音!');
                        let videoURL = window.URL.createObjectURL(stream);
                        MeetingActions.gotLocalVideo(videoURL);
                        localStream = stream;
                        MeetingActions.changeVideoReadyState();
                        socket.emit('newParticipantA', id, room);
                    } else {
                        navigator.mediaDevices.getUserMedia({
                            audio: true
                        }).then((stream) => {
                            console.log('沒有影像但是有聲音!');
                            let videoURL = window.URL.createObjectURL(stream);
                            MeetingActions.gotLocalVideo(videoURL);
                            localStream = stream;
                            MeetingActions.changeVideoReadyState();
                            socket.emit('newParticipantA', id, room);
                        }).catch((e) => {
                            console.log(e);
                        });
                    }
                })
                .catch((e) => {
                    socket.emit('newParticipantA', id, room);
                    alert("無法偵測到您的麥克風或鏡頭，請重新授權，WeMeet基於WebRTC連線，必需要其中");
                    window.location.replace('https://140.123.175.95:8787');
                });
        };

        Chat.toggleUserMedia = () => {
            localStream.getVideoTracks()[0].enabled = !(localStream.getVideoTracks()[0].enabled);
        };

        Chat.toggleAudio = () => {
            localStream.getAudioTracks()[0].enabled = !(localStream.getAudioTracks()[0].enabled);
        }

        //建立點對點連線物件，以及為連線標的創建影像視窗
        Chat.createPeerConnection = (isInitiator, config, remotePeer, socket) => {
            console.log(1);
            let peerConn = new RTCPeerConnection(config);
            console.log(2);
            if (localStream) {
                peerConn.addStream(localStream);
            }

            for (let id in MeetingStore.state.candidateQueue) {
                console.log('加回來');
                if (id == remotePeer) {
                    peerConn.addIceCandidate(new RTCIceCandidate(MeetingStore.state.candidateQueue[id]));
                }
            }

            // send any ice candidates to the other peer
            peerConn.onicecandidate = (event) => {
                if (event.candidate) {
                    //console.log('local端找到ice candidate>要傳出去: ' + JSON.stringify(event.candidate));
                    socket.emit('onIceCandidateA', event.candidate, localUserID, remotePeer);
                }
            };

            peerConn.onaddstream = (event) => {
                console.log('收到遠端加入影像');
                let url = URL.createObjectURL(event.stream);
                MeetingActions.addRemoteStreamURL({
                    a: remotePeer,
                    b: url
                });
            };

            peerConn.onremovestream = (event) => {
                console.log('收到遠端離開');
                // console.log('Remote stream removed. Event: ', event);
                MeetingActions.userLeft(remotePeer);
            };

            //如果是開啟P2P的人
            if (isInitiator) {
                console.log(3);
                //console.log('Createing Data Channel');
                //建立資料傳送頻道、訊息傳送頻道
                let fileChannel = peerConn.createDataChannel('files');
                let msgChannel = peerConn.createDataChannel('messages');
                fileChannels[remotePeer] = fileChannel;
                msgChannels[remotePeer] = msgChannel;

                //建立成功後，立即處理
                onDataChannelCreated(fileChannel);
                onDataChannelCreated(msgChannel);

                // //開啟通道後，初始化download物件
                // downloadAnchor.textContent = '';
                // downloadAnchor.removeAttribute('download');
                // if (downloadAnchor.href) {
                //     //停止連結的引用/作用
                //     URL.revokeObjectURL(downloadAnchor.href);
                //     downloadAnchor.removeAttribute('href');
                // }
            } else {
                //如果不是開房的，是加入別人的房間
                //如果有連線成功，會接到這個事件
                peerConn.ondatachannel = (event) => {
                    console.log('ondatachannel:', event.channel.label);
                    //加入別人建立的頻道
                    if (event.channel.label == 'files') {
                        //開啟通道後，初始化HTML元素
                        // downloadAnchor.textContent = '';
                        // downloadAnchor.removeAttribute('download');
                        // if (downloadAnchor.href) {
                        //     URL.revokeObjectURL(downloadAnchor.href);
                        //     downloadAnchor.removeAttribute('href');
                        // }
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
                    if (typeof event.data === 'string') {
                        let received = new window.Blob(receiveBuffer);
                        receiveBuffer = [];
                        fileContainer = URL.createObjectURL(received);
                    }
                    //把每個ArrayBuffer都存在同一個陣列裡
                    receiveBuffer.push(event.data); //把資料push進陣列
                } else if (channel.label == 'messages') {
                    MeetingActions.receiveMsg(event.data);
                }
            };
        };

        Chat.sendText = (value, localUserID) => {
            if (!value) {
                alert('你不打字我是要傳什麼，是不是沒被揍過');
                return;
            }
            //取得現在時間
            let date = new Date();
            //自定義時間格式:Hour-Minute
            let formattedTime = date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();

            for (let id in msgChannels) {
                msgChannels[id].send(JSON.stringify({
                    'UserID': localUserID,
                    'Sendtime': formattedTime,
                    'Text': value
                }));
            }
            return ({
                'UserID': localUserID,
                'Sendtime': formattedTime,
                'Text': value
            })
        };

        Chat.sendFileToUser = (files) => {
            if (!files) {
                alert('沒有給我檔案我生77喔!');
                return;
            }
            //這個功能是直接將檔案廣播給房內的人，沒有存進資料庫
            //假設一次上傳多個檔案，files[0]指的是第一個傳的檔案
            //這裡暫時只做單一檔案上傳功能
            //webrtc的data channel一次最多只能傳送16*1024Bytes的檔案
            let file = files;
            console.log('File is ' + [file.name, file.size, file.type, file.lastModifiedDate].join(', '));

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
                            }));
                        }
                    }
                };
                //從檔案開頭，切一塊16384的檔案下來
                let slice = file.slice(offset, offset + chunkSize);
                reader.readAsArrayBuffer(slice);
            };
            sliceFile(0);
        };


        Chat.sendFileToDB = (localUserID, files) => {
            //假設一次上傳多個檔案，files[0]指的是第一個傳的檔案
            //這裡只做單一檔案上傳功能
            let file = files;
            console.log('File is ' + [file.name, file.size, file.type, file.lastModifiedDate].join(', '));
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
        return Chat;
    }
};

module.exports = Chat;
