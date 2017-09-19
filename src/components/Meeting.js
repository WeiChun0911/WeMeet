"use strict";
//第三方
import React from "react";
import { connect } from "react-redux";
import socket from "../socket";
//lib
import chat from "../lib/chat";
import recognition from "../lib/recognition";
import Recorder from "../lib/recorder";
//component
import IndexLogo from "./IndexLogo";
import ParticipantList from "./ParticipantList";
//action
import {
    addParticipantList,
    addParticipantConnection,
    delParticipantConnection,
    addRemoteStreamURL,
    delRemoteStreamURL,
    addCandidateQueue
} from "../actions/Actions";

import Meeting1 from "./Meeting1.json";
import Meeting2 from "./Meeting2.json";

let configuration = {
    iceServers: [
        {
            url: [
                "stun.l.google.com:19302",
                "stun1.l.google.com:19302",
                "stun2.l.google.com:19302",
                "stun3.l.google.com:19302",
                "stun4.l.google.com:19302"
            ]
        },
        {
            url: "stun:stun.services.mozilla.com"
        }
    ]
};

class Meeting extends React.Component {
    constructor(props) {
        super(props);
        this.Chat = chat.createNew(this);
        this.Recognizer = recognition.createNew(this);
        this.localUserID = "";
        this.videoList = [];
        this.getSystemTime = this.getSystemTime.bind(this);
        //this.Chat.toggleUserMedia = this.Chat.toggleUserMedia.bind(this.Chat);
        this.languageList = Meeting1;
        this.hatList = Meeting2;
        this.setRemoteFinished = [];
        this.candidateQueue = {};
        this.state = {
            time: "",
            roomURL: "沒東西欸?",
            isStreaming: false,
            isSounding: false,
            isRecognizing: false,
            videoIsReady: false,
            localVideoURL: "",
            isinviteOpen: false,
            isAgendaOpen: false,
            isBrainstormingOpen: false,
            agendaList: [],
            hatColor: [],
            recognitionResult: "",
            textRecord: [],
            connections: {}
        };
    }

    componentWillMount() {}

    componentDidMount() {
        window.connections = {};
        this.getRoom();
        //初始化區
        socket.emit("IAmAt", window.location.pathname, window.location.hash);
        socket.emit("giveMeMySocketId");

        this.getSystemTime();
        this.timer = setInterval(this.getSystemTime, 1000);

        socket.on("gotSocketID", id => {
            this.localUserID = id;
            //this.props.dispatch(addParticipant(this.localUserID));
            this.Recognizer.id = this.localUserID;
            this.Chat.getUserMedia(
                this.localUserID,
                window.location.hash,
                socket
            );
        });

        socket.on("joinRoom", () => {
            socket.emit("join", window.location.hash);
        });

        //連線區
        socket.on("newParticipantB", participantID => {
            console.log("有人加入，Createing OFFER");
            //接到新人加入的訊息時，檢查是否已有連線
            if (window.connections[participantID]) {
                console.log("已存在，刪除該連線，再重新連線");
                window.connections = {
                    ...window.connections,
                    [participantID]: {}
                };

                //this.props.dispatch(delParticipantConnection(participantID));
            }
            //主動建立連線
            let isInitiator = true;
            let peerConn = this.Chat.createPeerConnection(
                isInitiator,
                configuration,
                participantID,
                socket,
                1
            );
            window.connections = {
                ...window.connections,
                [participantID]: peerConn
            };
            console.error("???????");
            peerConn
                .createOffer()
                .then(offer => {
                    console.log("offer" + JSON.stringify(offer));
                    peerConn.setLocalDescription(offer);
                    socket.emit(
                        "offerRemotePeer",
                        offer,
                        this.localUserID,
                        participantID
                    );
                })
                .catch(e => {
                    console.log("發生錯誤了看這裡: " + e);
                });
            // peerConn.createOffer(
            //     (offer)=>{
            //         console.log("Create Offer, Success(d)")
            //         peerConn.setLocalDescription(offer,
            //             ()=>{
            //                 console.log("set LocalDesc, Success(e)")
            //                 console.log(offer)
            //                 socket.emit(
            //                     "offerRemotePeer",
            //                     offer,
            //                     this.localUserID,
            //                     participantID
            //                 );
            //                 console.log("socket emit offer, Success(f)")
            //             },
            //             ()=>{
            //                 console.log("set LocalDesc, Failed(e)")
            //             }
            //         );
            //     },
            //     ()=>{
            //         console.log("Create Offer, Failed(d)")
            //     },{
            //         offerToReceiveAudio: true,
            //         offerToReceiveVideo: true
            //     }
            // )
        });

        socket.on("answer", (answer, sender) => {
            console.log("answer" + JSON.stringify(answer));
            //console.log('有收到answer喔!');
            window.connections[sender].setRemoteDescription(
                new RTCSessionDescription(answer)
            );
            //console.log("answer" + JSON.stringify(answer));
            //console.log('有收到answer喔!');

            // window.connections[sender].setRemoteDescription(
            //     new RTCSessionDescription(answer),
            //     ()=>{
            //         console.log("On answer ,setRemote, Success(g)")
            //         console.log("加一波iceCandidate(h)")
            //         if(this.candidateQueue[sender]){
            //             this.candidateQueue[sender].map((candidate)=>{
            //                 window.connections[sender].addIceCandidate(new RTCIceCandidate(candidate))
            //             })
            //             //delete this.candidateQueue[sender]
            //         }
            //         this.setRemoteFinished.push(sender);
            //         console.log("開啟自動加iceCandidate(i)")
            //         // Object.keys(this.props.candidateQueue).map((key)=>{
            //         //     if(key == sender){
            //         //         console.log("add Candidiate(X)")
            //         //         this.props.candidateQueue[sender].map(()=>{

            //         //         })
            //         //         peerConn.addIceCandidate(this.props.candidateQueue[sender])
            //         //     }
            //         // })
            //     },
            //     (error)=>{
            //         console.log("On answer ,setRemote, Failed(f)")
            //         console.log(error)
            //     },
            //     {
            //         offerToReceiveAudio: true,
            //         offerToReceiveVideo: true
            //     }
            // );
            //console.log(window.connections[sender].getRemoteStreams()[0]);
        });

        socket.on("offer", (offer, sender) => {
            console.log("on offer!");
            //檢查是否已有連線
            if (window.connections[sender]) {
                console.log("已存在，刪除該連線，再重新連線");
                window.connections = {
                    ...window.connections,
                    [sender]: {}
                };

                //this.props.dispatch(delParticipantConnection(participantID));
            }
            //console.log('收到遠端的 offer，要建立連線並處理');
            let isInitiator = false;
            let peerConn = this.Chat.createPeerConnection(
                isInitiator,
                configuration,
                sender,
                socket
            );

            window.connections = {
                ...window.connections,
                [sender]: peerConn
            };

            peerConn
                .setRemoteDescription(new RTCSessionDescription(offer))
                .then(() => {
                    return peerConn.createAnswer();
                })
                .then(answer => {
                    console.log("創建好本地端的 " + answer + "，要傳出去");
                    peerConn.setLocalDescription(answer);
                    socket.emit(
                        "answerRemotePeer",
                        answer,
                        this.localUserID,
                        sender
                    );
                })
                .catch(e => {
                    console.log("發生錯誤了看這裡:" + e);
                });
            // peerConn.setRemoteDescription(
            //         new RTCSessionDescription(offer),
            //         ()=>{
            //             console.log("setRemoteDesc, Success(b)")

            //             peerConn.createAnswer(
            //                 (answer)=>{
            //                     console.log("createAnswer, Success(c)");
            //                     peerConn.setLocalDescription(
            //                         answer,
            //                         ()=>{
            //                             console.log("setLocalDesc, Success(d), ANSWER:")
            //                             console.log(answer)
            //                             socket.emit(
            //                                 "answerRemotePeer",
            //                                 answer,
            //                                 this.localUserID,
            //                                 sender
            //                             );

            //                             console.log("send Answer to Remote, Success(e)")
            //                             console.log("加一波iceCandidate(f)")
            //                             if(this.candidateQueue[sender]){
            //                                 this.candidateQueue[sender].map((candidate)=>{
            //                                     window.connections[sender].addIceCandidate(new RTCIceCandidate(candidate))
            //                                 });
            //                                 delete this.candidateQueue[sender]
            //                             }
            //                             this.setRemoteFinished.push(sender);
            //                             console.log("開啟自動加iceCandidate(g)")
            //                         },
            //                         ()=>{
            //                              console.log("setLocalDesc, Failed(d)")
            //                         });
            //                 },
            //                 (error)=>{
            //                     console.log("createAnswer, Failed(c)")
            //                 });
            //         },
            //         ()=>{
            //             console.error("setRemoteDesc, Failed(b)")
            //         });
        });

        socket.on("onIceCandidateB", (candidate, sender) => {
            // if(this.setRemoteFinished.includes(sender)){
            //     window.connections[sender].addIceCandidate(new RTCIceCandidate(candidate))
            // } else {
            //     console.log("onIceCandidate，存起來先，set完remote再加")
            //     if(this.candidateQueue[sender]){
            //         this.candidateQueue[sender].push(candidate);
            //     } else {
            //         this.candidateQueue[sender]=[candidate]
            //     }

            // }
            console.log("收到遠端的candidate，要加入: " + JSON.stringify(candidate));
            if (window.connections[sender]) {
                console.log("加到了!");
                window.connections[sender]
                    .addIceCandidate(new RTCIceCandidate(candidate))
                    .catch(e => {
                        console.log("發生錯誤了看這裡: " + e);
                    });
            } else {
                console.log("不!來不及加");
                if (this.candidateQueue[sender]) {
                    console.log("111");
                    this.candidateQueue[sender].push(candidate);
                } else {
                    console.log("222");
                    this.candidateQueue[sender] = [candidate];
                }
            }
        });

        socket.on("participantDisconnected", participantID => {
            window.connections = Object.assign(
                {},
                {
                    connections: Object.keys(
                        window.connections
                    ).reduce((result, key) => {
                        if (key !== participantID) {
                            result[key] = window.connections[key];
                        }
                        return result;
                    }, {})
                }
            );
            // this.props.dispatch(delParticipantConnection(participantID));
            this.props.dispatch(delRemoteStreamURL(participantID));
        });

        //0516 更新腦力激盪
        // socket.on("OpenBrainForAll", function(agenda) {
        //     //console.log(agenda);
        //     //MeetingActions.changeBrainstormingState();
        // });

        //0516 更新消失的議程
        socket.on("addAgendaForAll", function(agenda) {
            this.setState({
                agendaList: agenda
            });
        });

        socket.on("deleteAgendaForAll", function(agenda) {
            this.setState({
                agendaList: agenda
            });
        });

        for (let i = 0; i < this.languageList.length; i++) {
            this.refs.select_language.options[i] = new Option(
                this.languageList[i][0],
                i
            );
        }
        this.refs.select_language.selectedIndex = 36;
        this.updateCountry();
        this.refs.select_dialect.selectedIndex = 2;

        socket.on("videoFromDB", arrayBuffer => {
            //console.log("Getting blob form DB and server!!");
            let blob = new Blob([arrayBuffer], {
                type: "video/webm"
            });
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            a.href = url;
            a.download = this.localUserID + ".webm";
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    componentWillUnmount() {
        clearInterval(this.timer);
        socket.emit("leaveRoom");
        if (this.state.isStreaming) {
            this.Chat.toggleUserMedia();
        }
        if (this.state.isSounding) {
            this.Chat.toggleAudio();
        }
        socket
            .off("gotSocketID")
            .off("joinRoom")
            .off("newParticipantB")
            .off("answer")
            .off("offer")
            .off("onIceCandidateB")
            .off("participantDisconnected");
    }

    getRoom() {
        if (window.location.hash) {
            this.setState({
                roomURL: window.location.href
            });
        } else {
            window.location.hash = Math.floor((1 + Math.random()) * 1e16)
                .toString(16)
                .substring(8);
            this.setState({
                roomURL: window.location.href
            });
        }
    }

    getSystemTime() {
        let d = new Date();
        d =
            d.getFullYear() +
            "-" +
            ("0" + (d.getMonth() + 1)).slice(-2) +
            "-" +
            ("0" + d.getDate()).slice(-2) +
            " " +
            ("0" + d.getHours()).slice(-2) +
            ":" +
            ("0" + d.getMinutes()).slice(-2) +
            ":" +
            ("0" + d.getSeconds()).slice(-2);
        this.setState({
            time: d
        });
    }

    handleSendText_Click() {
        let inputText = this.refs.meet_input.value;
        this.Chat.sendText(inputText);
        this.refs.meet_input.value = "";
    }

    handleSendText_Enter(e) {
        if (e.charCode == 13) {
            //按下enter後
            e.preventDefault();
            this.handleSendText_Click();
        }
    }

    toUser() {
        let file = this.refs.meet_fileupload.files[0];
        this.Chat.sendFileToUser(file);
    }

    download() {
        this.recorder.download();
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
        let list = this.languageList[this.refs.select_language.selectedIndex];
        //把那個國家的方言new出來
        for (let i = 1; i < list.length; i++) {
            //選項      //值
            this.refs.select_dialect.options.add(
                new Option(list[i][1], list[i][0])
            );
            if (list[i][1]) {
                this.refs.select_dialect.style.visibility = "initial";
            } else {
                this.refs.select_dialect.style.visibility = "hidden";
            }
        }
    }

    onClick_invitepage() {
        this.setState({
            isinviteOpen: !this.state.isinviteOpen
        });
    }

    onClick_backtoindex() {
        let txt;
        let r = confirm("要結束會議，並檢視會議紀錄?");
        if (r == true) {
            window.location.href = "https://140.123.175.95:8787/history" + room;
        }
    }

    onClick_agenda() {
        this.setState({
            isAgendaOpen: !this.state.isAgendaOpen
        });
    }

    onClick_deleteAgenda(key) {
        this.setState({
            agendaList: this.state.agendaList.filter(item => {
                return item !== key;
            })
        });
        socket.emit("deleteAgenda", this.state.agendaList);
    }

    onClick_addAgenda() {
        if (this.refs.agenda_input.value) {
            let newText = this.refs.agenda_input.value;
            this.setState({
                agendaList: this.state.agendaList.concat([newText])
            });
            socket.emit("addAgenda", this.state.agendaList);
            this.refs.agenda_input.value = "";
        }
    }

    onClick_BrainToggle() {
        if (!this.state.isBrainstormingOpen) {
            this.changeHat();
        }
        this.setState({
            isBrainstormingOpen: !this.state.isBrainstormingOpen
        });
    }

    changeHat() {
        let random = Math.floor(Math.random() * 5);
        this.setState({
            hatColor: this.hatList[random]
        });
    }

    render() {
        let remoteVideo = [];
        for (let id in window.connections) {
            if (this.props.remoteStreamURL) {
                if (this.props.remoteStreamURL[id]) {
                    remoteVideo.push(
                        <div id="VideoUser-audio-on">
                            <video
                                id={"videoSrc"}
                                width="220"
                                key={id}
                                autoPlay={true}
                            >
                                <source
                                    src={
                                        this.props.remoteStreamURL[id]
                                            ? this.props.remoteStreamURL[id]
                                            : "沒加到啦幹"
                                    }
                                />
                            </video>
                        </div>
                    );
                } else {
                    //console.log("user not exist")
                }
            } else {
                remoteVideo.push(
                    <div id="VideoUser-audio-on">
                        <video
                            autoPlay={true}
                            id={"videoSrc"}
                            width="220"
                            key={id}
                            autoPlay={true}
                        />
                    </div>
                );
            }
        }
        let agenda;
        if (this.state.agendaList.length > 0) {
            agenda = this.state.agendaList.map(item => {
                return (
                    <li id="agenda-li">
                        {item}
                        <button
                            onClick={() => this.onClick_deleteAgenda(item)}
                            id="cancel"
                        >
                            刪除
                        </button>
                    </li>
                );
            });
        }

        let chat = [];
        if (this.state.textRecord.length > 0) {
            this.state.textRecord.map(obj => {
                if (obj.userID == this.localUserID) {
                    console.log(obj);
                    chat.push(
                        <div id="me_sent">
                            <div className="arrow_box4">
                                <div id="me-text">{obj.text}</div>
                            </div>
                            <div id="me-sendtime">{obj.sendTime}</div>
                        </div>
                    );
                } else {
                    console.log(obj);
                    chat.push(
                        <div id="number_sent">
                            <div id="number-userid">{obj.userID}</div>
                            <div className="arrow_box3">
                                <div id="number-text">{obj.text}</div>
                            </div>
                            <div id="number-sendtime">{obj.sendTime}</div>
                        </div>
                    );
                }
            });
        }

        let brainSupport;
        if (this.state.hatColor[2]) {
            brainSupport = this.state.hatColor[2].map(value => {
                return <li>{value}</li>;
            });
        }

        return (
            <div>
                <IndexLogo />
                <ParticipantList />
                <div className="box-b">
                    <div id="meet_chat">
                        <div id="chat_menu">
                            <div id="button" />
                            <div id="meet_name">WeMeet開會群組</div>
                        </div>
                        <div id="chatbox">{chat}</div>

                        <div id="yourvoice">
                            <img
                                id="voice_img"
                                src={
                                    this.state.isRecognizing
                                        ? "../img/mic-animate.gif"
                                        : "../img/mic.gif"
                                }
                            />
                            {this.state.recognitionResult}
                        </div>
                        <div id="meet_chat_input">
                            <textarea
                                onKeyPress={e => {
                                    this.handleSendText_Enter(e);
                                }}
                                id="meet_input"
                                ref="meet_input"
                            />
                            <button
                                className="sent"
                                type="submit"
                                ref="meet_submit"
                                maxLength="25"
                                onClick={() => {
                                    this.handleSendText_Click();
                                }}
                            >
                                送出
                            </button>
                        </div>
                    </div>
                    <div id="feature">
                        <div className="left">
                            <button
                                id={
                                    this.state.isRecognizing
                                        ? "recognize-on"
                                        : "recognize-off"
                                }
                                onClick={this.Recognizer.toggleButtonOnclick}
                            >
                                {this.state.isRecognizing ? "停止辨識" : "開始辨識"}
                            </button>
                            <button
                                id={
                                    this.state.isStreaming
                                        ? "video-off"
                                        : "video-on"
                                }
                                onClick={() => {
                                    this.Chat.toggleUserMedia();
                                }}
                            >
                                {this.state.isStreaming ? "停止視訊" : "開起視訊"}
                            </button>
                            <button
                                id={
                                    this.state.isSounding
                                        ? "audio-off"
                                        : "audio-on"
                                }
                                onClick={this.Chat.toggleAudio}
                            >
                                {this.state.isSounding ? "靜音" : "取消靜音"}
                            </button>
                        </div>

                        <div className="center">
                            <button
                                id="invite"
                                onClick={this.onClick_invitepage.bind(this)}
                            >
                                邀請
                            </button>
                            <button
                                id={
                                    this.state.isAgendaOpen
                                        ? "agenda-off"
                                        : "agenda-on"
                                }
                                onClick={this.onClick_agenda.bind(this)}
                            >
                                {this.state.isAgendaOpen ? "關閉議程" : "議程清單"}
                            </button>
                            <button
                                id={
                                    this.state.isBrainstormingOpen
                                        ? "brainstorming-off"
                                        : "brainstorming-on"
                                }
                                onClick={this.onClick_BrainToggle.bind(this)}
                            >
                                {this.state.isBrainstormingOpen ? "關閉" : "腦力激盪"}
                            </button>

                            <div id="systemTime">系統時間：{this.state.time}</div>
                        </div>

                        <div className="right">
                            <button id="end" onClick={this.onClick_backtoindex}>
                                結束會議
                            </button>
                        </div>
                    </div>

                    <div id="meet_main" ref="meet_main">
                        <div
                            id={
                                this.state.isRecognizing
                                    ? "recognition_detail_off"
                                    : "recognition_detail_on"
                            }
                        >
                            <select
                                name="language"
                                id="language"
                                ref="select_language"
                                onClick={this.updateCountry.bind(this)}
                            />
                            <select
                                name="dialect"
                                id="dialect"
                                ref="select_dialect"
                                onClick={e => {
                                    this.Recognizer.setLanguage(e.target);
                                }}
                            />
                        </div>

                        <div
                            id={
                                this.state.isinviteOpen
                                    ? "invite_detail_on"
                                    : "invite_detail_off"
                            }
                        >
                            <div id="meetpage">網址：</div>
                            <textarea
                                id="pagetext"
                                value={this.state.roomURL}
                            />
                        </div>
                        <div
                            id={
                                this.state.isSounding
                                    ? "VideoUser-audio-on"
                                    : "VideoUser-audio-off"
                            }
                        >
                            <video
                                id="videoSrc"
                                width="220"
                                muted="muted"
                                src={
                                    this.state.videoIsReady &&
                                    this.state.isStreaming
                                        ? this.state.localVideoURL
                                        : "沒在播放欸或是沒加到影像"
                                }
                                autoPlay={true}
                            />
                        </div>
                        {remoteVideo}

                        <div
                            id={
                                this.state.isAgendaOpen
                                    ? "nowagenda-on"
                                    : "nowagenda-off"
                            }
                        >
                            <div id="now_agenda">議程清單</div>
                            <div id="agenda_content">
                                <ol>{agenda}</ol>
                            </div>
                            <input
                                type="text"
                                id="user_input"
                                maxLength="25"
                                ref="agenda_input"
                            />
                            <button
                                id="agenda_button"
                                onClick={this.onClick_addAgenda.bind(this)}
                            >
                                新增
                            </button>
                        </div>

                        <div
                            id={
                                this.state.isBrainstormingOpen
                                    ? "brainbox-on"
                                    : "brainbox-off"
                            }
                        >
                            <div id="BrainText">腦力激盪</div>
                            <div id="BraomSupprot">
                                玩法說明：<br />
                                1. 每個與會者都擁有一頂顏色的帽子<br />
                                2. 每頂帽子都扮演著不同的角色<br />
                                3. 請根據個各帽子說明文字，盡力扮演其角色
                            </div>
                            <div id="BrainHat">
                                你目前所戴的帽子
                                <br />
                                <img
                                    src={
                                        "../img/" +
                                        this.state.hatColor[0] +
                                        ".png"
                                    }
                                />
                            </div>
                            <div id="BarinHatText">
                                <ul>{brainSupport}</ul>
                            </div>
                            <button
                                className="btn"
                                onClick={() => {
                                    this.changeHat();
                                }}
                            >
                                換帽子
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        remoteStreamURL: state.connection.remoteStreamURL
        //candidateQueue: state.connection.candidateQueue
    };
};

export default connect(mapStateToProps)(Meeting);
