'use strict';
import React from 'react';
import MeetingStore from '../stores/MeetingStore';
import MeetingActions from '../actions/MeetingActions';
import chat from '../lib/chat';
import recognition from '../lib/recognition';
import Recorder from '../lib/recorder';
import socket from '../socket';
import FriendList from './FriendList';
import IndexLogo from './IndexLogo';
import FriendListStore from '../stores/FriendListStore';
import HistoryAction from '../actions/HistoryActions';

socket.emit('id');

let configuration = {
    'iceServers': [{
        'url': 'stun:stun.l.google.com:19302'
    }, {
        'url': 'stun:stun.services.mozilla.com'
    }]
};


let room = window.location.hash;

window.onbeforeunload = function() {
    socket.emit('leaveRoom', room);
};

class Meeting extends React.Component {
    constructor(props) {

        super(props);
        this.state = MeetingStore.getState();
        this.onChange = this.onChange.bind(this);
        this.recorder = new Recorder();
        this.Chat = chat.createNew(MeetingActions, MeetingStore);
        this.Recognizer = recognition.createNew(MeetingActions, MeetingStore, socket, room);
        this.localUserID = "";
        // this.videoList = [];
        // this.tagList = {};
        this.isRecording = true;
        this.isPlaying = true;
        this.meetpage = window.location;
        this.ChatList = [];
        this.room = window.location.hash;
    }

    componentDidMount() {
        //socket.emit('getFakeName');
        MeetingStore.listen(this.onChange);

        //0516 更新系統時間
        MeetingActions.getSystemTime();
        this.timer = setInterval(MeetingActions.getSystemTime, 1000);

        // socket.on('onFakeName', (obj) => {
        //     MeetingActions.setFakeName(obj);
        // })

        //0516 更新腦力激盪
        socket.on('OpenBrainForAll', function(agenda) {
            console.log(agenda);
            MeetingActions.changeBrainstormingState();
        });

        //0516 更新消失的議程
        socket.on('addAgendaForAll', function(agenda) {
            MeetingActions.listenAgenda(agenda);
        });

        socket.on('deleteAgendaForAll', function(agenda) {
            MeetingActions.listenAgenda(agenda);
        });

        socket.on('success', (id) => {
            if (!room) {
                room = Math.floor((1 + Math.random()) * 1e16).toString(16).substring(8);
                window.location.hash = room;
            }
            this.localUserID = id;
            this.Recognizer.id = this.localUserID;
            this.Chat.getUserMedia(id, room, socket);
            socket.emit('join', room);
        });

        
        for (let i = 0; i < this.state.langs.length; i++) {
            this.refs.select_language.options[i] = new Option(this.state.langs[i][0], i);
        }
        this.refs.select_language.selectedIndex = 36;
        this.updateCountry();
        this.refs.select_dialect.selectedIndex = 2;

        socket.on('newParticipantB', (participantID) => {
            //接到新人加入的訊息時，檢查是否已有連線
            if (this.state.connections[participantID]) {
                console.log('已存在刪除該連線，再重新連線');
                MeetingActions.userLeft(participantID);
            }
            //主動建立連線
            let isInitiator = true;
            let peerConn = this.Chat.createPeerConnection(isInitiator, configuration, participantID, socket);
            MeetingActions.newParticipant({ a: participantID, b: peerConn });
            peerConn.createOffer()
                .then((offer) => {
                    console.log('offer' + JSON.stringify(offer));
                    peerConn.setLocalDescription(offer);
                    socket.emit('offerRemotePeer', offer, this.localUserID, participantID);
                })
                .catch((e) => {
                    console.log('發生錯誤了看這裡: ' + e);
                });
            //MeetingActions.addRemoteStreamURL
            //console.log(peerConn.getRemoteStreams());
        });

        socket.on('answer', (answer, sender) => {
            console.log('answer' + JSON.stringify(answer));
            //console.log('有收到answer喔!');
            this.state.connections[sender].setRemoteDescription(new RTCSessionDescription(answer));
            //console.log(this.state.connections[sender].getRemoteStreams()[0]);
        });

        socket.on('onIceCandidateB', (candidate, sender) => {
            //console.log('收到遠端的candidate，要加入: ' + JSON.stringify(candidate));
            if (this.state.connections[sender]) {
                //console.log('加到了!');
                this.state.connections[sender].addIceCandidate(new RTCIceCandidate(candidate))
                    .catch((e) => {
                        console.log('發生錯誤了看這裡: ' + e);
                    });
            } else {
                MeetingActions.queueCandidate({ a: candidate, b: sender });
                //console.log('不!來不及加');
            }
        });

        socket.on('offer', (offer, sender) => {
            if (this.state.connections[sender]) {
                MeetingActions.userLeft(sender);
            }
            //console.log('收到遠端的 offer，要建立連線並處理');
            let isInitiator = false;
            let peerConn = this.Chat.createPeerConnection(isInitiator, configuration, sender, socket);
            MeetingActions.newParticipant({ a: sender, b: peerConn });
            peerConn.setRemoteDescription(new RTCSessionDescription(offer))
                .then(() => {
                    return peerConn.createAnswer();
                })
                .then((answer) => {
                    console.log('創建好本地端的 ' + answer + '，要傳出去');
                    peerConn.setLocalDescription(answer);
                    socket.emit('answerRemotePeer', answer, this.localUserID, sender);
                })
                .catch((e) => {
                    console.log('發生錯誤了看這裡:' + e);
                });
        });

        socket.on('participantLeft', (participantID) => {
            MeetingActions.userLeft(participantID);
        });

        socket.on('videoFromDB', (arrayBuffer) => {
            //console.log("Getting blob form DB and server!!");
            let blob = new Blob([arrayBuffer], { type: 'video/webm' });
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            a.href = url;
            a.download = this.localUserID + '.webm';
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    componentWillUnmount() {
        clearInterval(this.timer);
        window.onbeforeunload = function() {
            var prevent = false;
            events.emit("will-leave", {
                preventDefault: function(reason) { prevent = reason }
            });
            if (prevent) return prevent;
        }
        MeetingStore.unlisten(this.onChange);
    }

    onChange(state) {
        this.setState(state);
    }

    sendText() {
        let inputText = this.refs.meet_input.value;
        let mytext = this.Chat.sendText(inputText, this.localUserID);
        MeetingActions.Updatetext(mytext);
        this.refs.meet_input.value = '';
        inputText = '';
    }

    toUser() {
        let file = this.refs.meet_fileupload.files[0];
        this.Chat.sendFileToUser(file);
    }

    toggleRecording() {
        if (isRecording) {
            this.isRecording = false;
        }
        this.isRecording = true;
        this.isPlaying = false;
    }

    download() {
        this.recorder.download()
    }

    play() {
        this.recorder.play()
        this.isPlaying = true;
    }

    setLanguage(e) {
        this.Recognizer.setLanguage(e.target);
    }

    updateCountry() {
        //有換國家，就清空方言列
        for (let i = this.refs.select_dialect.options.length - 1; i >= 0; i--) {
            this.refs.select_dialect.remove(i);
        }
        //接著把那個國家的方言陣列取出來
        let list = this.state.langs[this.refs.select_language.selectedIndex];
        //把那個國家的方言new出來
        for (let i = 1; i < list.length; i++) {
            //選項      //值
            this.refs.select_dialect.options.add(new Option(list[i][1], list[i][0]));
        }
    }

    onClick_recognizeToggle() {
        this.Recognizer.toggleButtonOnclick();
    }

    onClick_videoToggle() {
        this.Chat.toggleUserMedia();
        MeetingActions.changeVideoState();
    }

    onClick_invitepage() {
        MeetingActions.changeInviteState();
    }

    onClick_AudioToggle() {
        this.Chat.toggleAudio();
        MeetingActions.changeAudioState();
    }

    onClick_backtoindex() {
        let txt;
        let r = confirm("要結束會議，並檢視會議紀錄?");
        if (r == true) {
            window.location.href = 'https://140.123.175.95:8787/history' + room;
        }
    }

    onClick_agenda() {
        MeetingActions.changeAgendaState();
    }

    onClick_deleteAgenda(text) {
        let deleteText = text;
        MeetingActions.deleteAgenda(deleteText);
    }

    onClick_addAgenda() {
        if (this.refs.agenda_input.value != '') {
            let newText = this.refs.agenda_input.value;
            this.refs.agenda_input.value = '';
            MeetingActions.addAgenda(newText);
        };
    }

    submitenter(myfield, e) {
        var keycode;
        if (window.event) keycode = window.event.keyCode;
        else if (e) keycode = e.which;
        else return true;
        if (keycode == 13) {
            myfield.form.submit();
            return false;
        } else
            return true;
    }

    handleTest(e) {
        if (e.charCode == 13) {
            //按下enter後
            this.sendText();
        }
        if (e.keyCode == 13) {}
    }

    

    onClick_BrainToggle() {
        MeetingActions.changeBrainstormingState();
        
        socket.emit('OpenBrain', this.brainImg);
    }

    onClick_changeHat() {
        MeetingActions.RandomBrain();
    }

    render() {

        //if(!this.state.agendaList){
            let agendalist = Object.keys(this.state.agendaList).map((keyName, keyIndex) => {
                this.agendatext = keyName;
                return (
                    <li id='agenda-li'>{this.agendatext}<button onClick={this.onClick_deleteAgenda.bind(this, this.agendatext)} id='cancel'>刪除</button></li>
                )
            });
        //}

        let remoteVideo = [];
        for (let id in this.state.connections) {
            if (this.state.remoteStreamURL[id]) {
                remoteVideo.push(<div id='VideoUser-audio-on'><video autoPlay={true}  id={"videoSrc"} width="220" key={id}><source src={this.state.remoteStreamURL[id]? this.state.remoteStreamURL[id]:'沒加到啦幹'} /></video></div>);
            } else {
                remoteVideo.push(<div id='VideoUser-audio-on'><video autoPlay={true}  id={"videoSrc"} width="220" key={id}></video></div>);
            }
        }

        if (this.state.otherchattext.Text != null) {
            let othertext = this.state.otherchattext;
            this.ChatList.push(
                <div id="number_sent">
                    <div id='number-userid'>{othertext.UserID}</div>
                    <div className="arrow_box3"><div id="number-text">{othertext.Text}</div></div>
                    <div id='number-sendtime'>{othertext.Sendtime}</div>
                </div>
            );
            this.state.otherchattext.Text = null;
        }

        if (this.state.mychattext.Text != null) {
            let mytext = this.state.mychattext;
            this.ChatList.push(
                <div id="me_sent">
                        <div className="arrow_box4"><div id="me-text">{mytext.Text}</div></div>
                        <div id='me-sendtime'>{mytext.Sendtime}</div>
                    </div>
            );
            this.state.mychattext.Text = null;
        }

        //if(!this.state.ColorHat){
            let brainSuppot = this.state.ColorHat.map((value) => {
                return (
                    <li>{value}</li>
                );
            });
        //}


        //0514 07:39 End
        return (
            <div >
                <IndexLogo />
                <FriendList />
                <div className="box-b">
                    <div id="meet_chat">
                        <div id="chat_menu">
                            <div id="button"></div>
                            <div id="meet_name">WeMeet開會群組</div>
                        </div>
                        <div id="chatbox">  
                            {this.ChatList}                        
                        </div>

                        <div id='yourvoice'>
                            <img id='voice_img' src={this.state.voiceimg}></img>
                            {this.state.interim_result}
                        </div>

                        <div id="meet_chat_input">
                            <textarea onKeyPress={this.handleTest} id="meet_input" ref='meet_input' ></textarea>
                            <button className="sent" type="submit" ref='meet_submit' maxLength="25" onClick={this.sendText.bind(this) } >送出</button>
                        </div>

                    </div>
                    <div id="feature">
                        <div className="left">
                            <button id={this.state.recognizeImg} onClick={this.onClick_recognizeToggle.bind(this)} >{this.state.recognizeState}</button>
                            <button id={this.state.videoImg} onClick={this.onClick_videoToggle.bind(this)} >{this.state.videoState}</button>
                            <button id={this.state.audioImg} onClick={this.onClick_AudioToggle.bind(this)} >{this.state.audioState}</button>
                        </div>

                        <div className="center">
                            <button id="invite"  onClick={this.onClick_invitepage}>邀請</button>
                            <button id={this.state.agendaImg} onClick={this.onClick_agenda.bind(this)}>議程清單</button>
                            <button id={this.state.brainImg} onClick={this.onClick_BrainToggle.bind(this)}>腦力激盪</button>
                            <button id="collaborative" >共筆</button>
                            <div id='systemTime'>系統時間：{this.state.systemTime}</div>
                        </div>

                        <div className="right">

                            <button id="end" onClick={this.onClick_backtoindex}>結束會議</button>
                        </div>
                    </div>

                    <div id="meet_main" ref="meet_main">

                        <div id={this.state.recordState} >
                            <select name="language" id='language' ref='select_language' onClick={this.updateCountry.bind(this)}>
                            </select>
                            <select name="dialect" id='dialect' ref='select_dialect' onClick={this.setLanguage.bind(this)}>
                            </select>
                        </div>

                        <div id={this.state.inviteState} >
                            <div id='meetpage'>網址：</div>
                            <textarea id='pagetext' >{this.meetpage}</textarea>
                        </div>
                        <div id={this.state.VideoAudio}><video id='videoSrc' width="220" muted="muted" src={this.state.isStreaming ? this.state.localVideoURL : "沒有加到啦幹"} autoPlay={true}></video></div>
                        {remoteVideo}

                        <div id={this.state.agendaState}>
                            <div id='now_agenda'>議程清單</div>
                            <div id='agenda_content'>
                                <ol>
                                    {agendalist}
                                </ol>
                            </div>
                            <input type='text' id='user_input' maxLength="25" ref='agenda_input' />
                            <button id='agenda_button' type="submit" onClick={this.onClick_addAgenda.bind(this)}>新增</button>
                        </div>

                        <div id={this.state.BrainState}>
                            <div id='BrainText'>腦力激盪</div>
                            <div id='BraomSupprot'>
                                玩法說明：<br/>
                                1. 每個與會者都擁有一頂顏色的帽子<br/>
                                2. 每頂帽子都扮演著不同的角色<br/>
                                3. 請根據個各帽子說明文字，盡力扮演其角色
                            </div>
                            <div id='BrainHat'>你目前所戴的帽子<br/><img src={this.state.BrainHat}></img></div>
                            <div id='BarinHatText'>
                                {brainSuppot}
                            </div>
                            <button className='btn' onClick={this.onClick_changeHat.bind(this)}>
                                全體換帽子
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        )
    }
}
export default Meeting;
