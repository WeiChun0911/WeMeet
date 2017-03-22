/*
 * (C) Copyright 2014 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
var ws = new WebSocket('wss://' + location.host + '/groupcall');
var participants = {};
var name;
var room;

window.onbeforeunload = function() {
    ws.close();
};

ws.onmessage = function(message) {
    var parsedMessage = JSON.parse(message.data);
    console.log('Received message: ' + message.data);
    switch (parsedMessage.id) {
        case 'existingParticipants':
            console.log("收到房間內部人員名單，現在開始向房間內部人員發出影像請求!");
            onExistingParticipants(parsedMessage);
            break;
        case 'newParticipantArrived':
            onNewParticipant(parsedMessage);
            break;
        case 'participantLeft':
            onParticipantLeft(parsedMessage);
            break;
        case 'receiveVideoAnswer':
            receiveVideoResponse(parsedMessage);
            break;
        case 'iceCandidate':
            participants[parsedMessage.name].rtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
                if (error) {
                    console.error("Error adding candidate: " + error);
                    return;
                }
            });
            break;
        default:
            console.error('Unrecognized message', parsedMessage);
    }
}

function register() {
    name = document.getElementById('name').value;
    room = document.getElementById('roomName').value;

    document.getElementById('room-header').innerText = 'ROOM ' + room;
    document.getElementById('join').style.display = 'none';
    document.getElementById('room').style.display = 'block';

    var message = {
        id: 'joinRoom',
        name: name,
        room: room
    }
    sendMessage(message);
}

function onNewParticipant(request) {
    console.log("有新的使用者進入房間: " + request.name);
    receiveVideo(request.name);
}

function receiveVideoResponse(result) {
    console.log(result.sdpAnswer);
    participants[result.name].rtcPeer.processAnswer(result.sdpAnswer, function(error) {
        if (error) return console.error(error);
    });
}

function callResponse(message) {
    if (message.response != 'accepted') {
        console.info('Call not accepted by peer. Closing call');
        stop();
    } else {
        webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
            if (error) return console.error(error);
        });
    }
}

function onExistingParticipants(existingParticipants) {
    var constraints = {
        audio: true,
        video: {
            mandatory: {
                maxWidth: 320,
                minFrameRate: 15
            }
        }
    };
    var participant = new Participant(name);
    participants[name] = participant;
    var video = participant.getVideoElement();

    var options = {
        localVideo: video,
        mediaConstraints: constraints,
        onicecandidate: participant.onIceCandidate.bind(participant)
    }
    //為本地端使用者創建一個影像傳送物件(RtcPeerSendonly)
    participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
        function(error) {
            if (error) {
                return console.error(error);
            }
            //本地端使用者影像傳送物件成功創建後，產生回應
            this.generateOffer(participant.offerToReceiveVideo.bind(participant));
        });
    //向所有房內成員發出影像請求
    existingParticipants.data.forEach(receiveVideo);
    console.log("使用者: " + name + " 已向所有已在房內的成員發出影像請求!");
}

function leaveRoom() {
    sendMessage({
        id: 'leaveRoom'
    });

    for (var key in participants) {
        participants[key].dispose();
    }

    document.getElementById('join').style.display = 'block';
    document.getElementById('room').style.display = 'none';

    ws.close();
}

//Sender為影像傳送者，亦指新加入的使用者，向他發出影像請求
function receiveVideo(sender) {
    console.log("向使用者: " + sender + " 發出影像請求!");
    var participant = new Participant(sender);
    participants[sender] = participant;
    var video = participant.getVideoElement();

    var options = {
        remoteVideo: video,
        onicecandidate: participant.onIceCandidate.bind(participant)
    }
    //讓房內的成員，為新加入的這個人，創建一個接收影像的物件
    //在此處的Participant為自己以外的房間成員物件，
    //在本地創建一個用來接收其他成員影像的RTCPeer(WebRtcPeerRecvonly)
    participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
        function(error) {
            if (error) {
                return console.error(error);
            }
            //generateOffer(傳入onOffer時的callback)
            this.generateOffer(participant.offerToReceiveVideo.bind(participant));
        });
}

function onParticipantLeft(request) {
    console.log('Participant ' + request.name + ' left');
    var participant = participants[request.name];
    participant.dispose();
    delete participants[request.name];
}

function sendMessage(message) {
    var jsonMessage = JSON.stringify(message);
    console.log('Senging message: ' + jsonMessage);
    ws.send(jsonMessage);
}
