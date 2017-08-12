const initialState = {
    
    


    videoIsReady : false,

    localStream : '',
    localVideoURL : '',

    isStreaming : false,

    meet_mytext : '',

    interim_result : '',
    final_result : '',

    isRecognizing : false,
    recognizeState : '開始辨識',
    videoState : '取消視訊',
    audioState : '靜音',

    recognizeImg : 'recognize-off',
    videoImg : 'video-off',
    audioImg : 'audio-on',

    inviteState : 'invite_detail_off',
    recordState : 'recognition_detail_on',
    candidateQueue : {},

    agendaState : 'nowagenda-off',
    agendaImg : 'agenda-on',
    agendaList : {},
    recognize : 'voice_img',
    voiceimg : '../img/mic.gif',
    mychattext : {},
    otherchattext : {},
    chatList : [],
    msgContainer : {},
    videoSrc : { visibility: 'visible' },

    VideoAudio: 'VideoUser-audio-on',
    brainImg: 'brainstorming-on',
    BrainState: 'brainbox-off',
    Hatnumber:0,
    BrainHat:'', //帽子圖片網址
    //ColorHat:[],
    
    systemTime : '' //系統時間
    //fakeName : {},
}

export default function meeting(state = initialState, action) {
    switch (action.type) {
        case "changeRecognizeState":
            return state;
        case "changeVideoState":
            return state;
        case "gotLocalVideo":
            return {...state , localVideoURL : action.data}
        // case "changeRecognizeState":
        //     return state;
        // case "changeRecognizeState":
        //     return state;
        // case "changeRecognizeState":
        //     return state;
        // case "changeRecognizeState":
        //     return state;
        default:
            return state;
    }
}


    // changeRecognizeState() {
    //     if (recognizeState :: '取消辨識' && recordState :: 'recognition_detail_off') {
    //         recognizeState : '開始辨識',
    //         recognizeImg : 'recognize-off',
    //         recordState : 'recognition_detail_on',
    //         isRecognizing : !isRecognizing,
    //         voiceimg : '../img/mic.gif',
    //     } else {
    //         recognizeState : '取消辨識',
    //         recognizeImg : 'recognize-on',
    //         recordState : 'recognition_detail_off',
    //         isRecognizing : !isRecognizing,
    //         voiceimg : '../img/mic-animate.gif',

    //     }
    // }

    // // setFakeName(obj){
    // //     fakeName : obj,
    // // }

    // changeVideoState() {
    //     if (videoState :: '取消視訊') {
    //         videoState : '視訊',
    //         videoImg : 'video-on',
    //         videoSrc : { visibility: 'hidden' },
    //     } else {
    //         videoState : '取消視訊',
    //         videoImg : 'video-off',
    //         videoSrc : { visibility: 'visible' },
    //     }
    // }

    // changeAudioState() {
    //     if (audioState :: '靜音') {
    //         audioState : "說話"
    //         audioImg : 'audio-off',
    //         VideoAudio: 'VideoUser-audio-off',
    //     } else {
    //         audioState : '靜音',
    //         audioImg : 'audio-on',
    //         VideoAudio: 'VideoUser-audio-on',
    //     }
    // }

    // changeInviteState() {
    //     if (inviteState :: 'invite_detail_off') {
    //         inviteState : 'invite_detail_on',
    //     } else {
    //         inviteState : 'invite_detail_off',
    //     }
    // }
    // changeVideoReadyState() {
    //     if (isStreaming) {
    //         videoIsReady : false,
    //     }
    //     isStreaming : !isStreaming,
    // }

    // changeAgendaState() {
    //     if (agendaState :: 'nowagenda-off') {
    //         agendaState : 'nowagenda-on',
    //         agendaImg : 'agenda-off',
    //     } else {
    //         agendaState : 'nowagenda-off',
    //         agendaImg : 'agenda-on',
    //     }
    // }

    // updateResult({ temp, final }) {
    //     interim_result : temp,
    //     final_result : final,
    // }

    // //按下F5、或關閉視窗時觸發
    // userLeft(id) {
    //     if (remoteStreamURL[id]) {
    //         delete remoteStreamURL[id],
    //     }
    //     delete connections[id],
    //     //delete fakeName[id],
    // }

    // newParticipant(object) {
    //     connections[object.a] : object.b,
    // }
    // addRemoteStreamURL(obj) {
    //     remoteStreamURL[obj.a] : obj.b,
    // }
    // queueCandidate(obj) {
    //     candidateQueue[obj.b] : obj.a,
    // }

    // addAgenda(data) {
    //     agendaList[data] : data,
    //     socket.emit('addAgenda', agendaList),
    // }

    // deleteAgenda(data) {
    //     delete agendaList[data],
    //     socket.emit('deleteAgenda', agendaList),
    // }

    // listenAgenda(data) {
    //         agendaList : data,
    //     }
    //     //0514 07:41 +1Update
    // Updatetext(obj) {
    //         mychattext : obj,
    //         mychatstatus : true,
    //     }
    //     //0514 07:41 +1End

    // receiveMsg(msg) {
    //     otherchattext : JSON.parse(msg),
    // }

    // RandomBrain(){
    //     Hatnumber : Math.floor(Math.random() * 6) + 1  ,
    //     if(Hatnumber==1) ColorHat : WhiteHat,
    //     if(Hatnumber::2) ColorHat : GreenHat,
    //     if(Hatnumber::3) ColorHat : BlueHat,
    //     if(Hatnumber::4) ColorHat : RedHat,
    //     if(Hatnumber::5) ColorHat : BlackHat,
    //     if(Hatnumber::6) ColorHat : YellowHat,
    //     BrainHat: '../img/'+Hatnumber+'.png',
    // },

    // changeBrainstormingState(){
    //     if(brainImg::'brainstorming-on'){
    //         RandomBrain(),
    //         brainImg:'brainstorming-off',
    //         BrainState:'brainbox-on',
    //     } else {
    //         brainImg:'brainstorming-on',
    //         BrainState:'brainbox-off',
    //     }
    // }


    // onGetSystemTimeSuccess(data){
    //     systemTime : data , //將時間指派給傳來的值
    // }

