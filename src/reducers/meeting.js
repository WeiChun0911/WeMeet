import alt from '../alt';
import MeetingActions from '../actions/MeetingActions';
import socket from '../socket';

class MeetingStore {
    constructor() {
        this.bindActions(MeetingActions);  
        this.connections = {}; //存放連線中的人的socket.id
        this.remoteStreamURL = {}; //存放連線中的人的stream
        this.videoIsReady = false;
        this.localStream = '';
        this.localVideoURL = '';
        this.isStreaming = false;
        this.meet_mytext = '';
        this.langs = [
            ['Afrikaans', ['af-ZA']],
            ['Bahasa Indonesia', ['id-ID']],
            ['Bahasa Melayu', ['ms-MY']],
            ['Català', ['ca-ES']],
            ['Čeština', ['cs-CZ']],
            ['Dansk', ['da-DK']],
            ['Deutsch', ['de-DE']],
            ['English', ['en-AU', 'Australia'],
                ['en-CA', 'Canada'],
                ['en-IN', 'India'],
                ['en-NZ', 'New Zealand'],
                ['en-ZA', 'South Africa'],
                ['en-GB', 'United Kingdom'],
                ['en-US', 'United States']
            ],
            ['Español', ['es-AR', 'Argentina'],
                ['es-BO', 'Bolivia'],
                ['es-CL', 'Chile'],
                ['es-CO', 'Colombia'],
                ['es-CR', 'Costa Rica'],
                ['es-EC', 'Ecuador'],
                ['es-SV', 'El Salvador'],
                ['es-ES', 'España'],
                ['es-US', 'Estados Unidos'],
                ['es-GT', 'Guatemala'],
                ['es-HN', 'Honduras'],
                ['es-MX', 'México'],
                ['es-NI', 'Nicaragua'],
                ['es-PA', 'Panamá'],
                ['es-PY', 'Paraguay'],
                ['es-PE', 'Perú'],
                ['es-PR', 'Puerto Rico'],
                ['es-DO', 'República Dominicana'],
                ['es-UY', 'Uruguay'],
                ['es-VE', 'Venezuela']
            ],
            ['Euskara', ['eu-ES']],
            ['Filipino', ['fil-PH']],
            ['Français', ['fr-FR']],
            ['Galego', ['gl-ES']],
            ['Hrvatski', ['hr_HR']],
            ['IsiZulu', ['zu-ZA']],
            ['Íslenska', ['is-IS']],
            ['Italiano', ['it-IT', 'Italia'],
                ['it-CH', 'Svizzera']
            ],
            ['Lietuvių', ['lt-LT']],
            ['Magyar', ['hu-HU']],
            ['Nederlands', ['nl-NL']],
            ['Norsk bokmål', ['nb-NO']],
            ['Polski', ['pl-PL']],
            ['Português', ['pt-BR', 'Brasil'],
                ['pt-PT', 'Portugal']
            ],
            ['Română', ['ro-RO']],
            ['Slovenščina', ['sl-SI']],
            ['Slovenčina', ['sk-SK']],
            ['Suomi', ['fi-FI']],
            ['Svenska', ['sv-SE']],
            ['Tiếng Việt', ['vi-VN']],
            ['Türkçe', ['tr-TR']],
            ['Ελληνικά', ['el-GR']],
            ['български', ['bg-BG']],
            ['Pусский', ['ru-RU']],
            ['Српски', ['sr-RS']],
            ['Українська', ['uk-UA']],
            ['한국어', ['ko-KR']],
            ['中文', ['cmn-Hans-CN', '普通话 (中国大陆)'],
                ['cmn-Hans-HK', '普通话 (香港)'],
                ['cmn-Hant-TW', '中文 (台灣)'],
                ['yue-Hant-HK', '粵語 (香港)']
            ],
            ['日本語', ['ja-JP']],
            ['हिन्दी', ['hi-IN']],
            ['ภาษาไทย', ['th-TH']]
        ];
        this.interim_result = '';
        this.final_result = '';

        this.isRecognizing = false;
        this.recognizeState = '開始辨識';
        this.videoState = '取消視訊';
        this.audioState = '靜音';

        this.recognizeImg = 'recognize-off';
        this.videoImg = 'video-off';
        this.audioImg = 'audio-on';

        this.inviteState = 'invite_detail_off';
        this.recordState = 'recognition_detail_on';
        this.candidateQueue = {};

        this.agendaState = 'nowagenda-off';
        this.agendaImg = 'agenda-on';
        this.agendaList = {};
        this.recognize = 'voice_img';
        this.voiceimg = '../img/mic.gif';
        this.mychattext = {};
        this.otherchattext = {};
        this.ChatList = [];
        this.msgContainer = {};
        this.videoSrc = { visibility: 'visible' };

        this.VideoAudio= 'VideoUser-audio-on';
        this.brainImg= 'brainstorming-on';
        this.BrainState= 'brainbox-off';
        this.Hatnumber=0;
        this.BrainHat=''; //帽子圖片網址
        this.ColorHat=[];
        this.WhiteHat=[
            '白色代表中性與客觀。',
            '白帽只會關心客觀的事實和數字。',
            '白帽不會受到感情因素的影響，不對事實加以論述',
            '白帽不會將其作為達成某種目的的手段，而僅僅是平白地敘述出來，否則會失去其客觀的立場。',
            '相關的例子像是：「請告訴我這個月的銷售數量」。'
        ];
        this.GreenHat=[
            '綠色代表生機勃勃、茁壯與成長。象徵創新與新觀念',
            '綠帽試圖擺脫舊想法，以便找出更好的新想法。',
            '綠帽思維需要新思想、新方法和更多的選擇',
            '綠帽只需要作出時間與努力產生新想法。'
        ];
        this.BlueHat=[
            '藍色代表冷靜，象徵控制與調整。',
            '藍帽需要利用其他顏色的帽子',
            '它定義主題，對各種思維實行集中，並對問題進行分類，決定需要執行的思維任務。',
            '藍帽負責概要、總攬和結論',
            '監督遊戲的規則得以遵守，是一種約束的存在。它就像是秩序的管理者一樣。'
        ];        
        this.RedHat=[
            '紅色代表生氣、發怒與各種感情。',
            '紅色討論的是思維中的情緒、感覺以及其他非理性方面',
            '例子：「我有一種直覺，他的行銷方案最終會失敗」',
            '例子：「我感覺她是所有人當中，最有洞見的人」'
        ];      
        this.BlackHat=[
            '黑色代表憂鬱和否定。象徵謹慎、批評。',
            '黑帽討論否定方面的問題，它消極且缺乏情感。',
            '黑帽強調的否定只限於在邏輯否定這一點上。',
            '黑帽大多對提出的數字和報告提出疑義。',
            '例如：「從過去的經驗來看，街頭宣傳對我們的品牌知名度沒有任何的效益。'
        ];
        this.systemTime = ''; //系統時間
        //this.fakeName = {};
    }

    changeRecognizeState() {
        if (this.recognizeState == '取消辨識' && this.recordState == 'recognition_detail_off') {
            this.recognizeState = '開始辨識';
            this.recognizeImg = 'recognize-off';
            this.recordState = 'recognition_detail_on';
            this.isRecognizing = !this.isRecognizing;
            this.voiceimg = '../img/mic.gif';
        } else {
            this.recognizeState = '取消辨識';
            this.recognizeImg = 'recognize-on';
            this.recordState = 'recognition_detail_off';
            this.isRecognizing = !this.isRecognizing;
            this.voiceimg = '../img/mic-animate.gif';

        }
    }

    // setFakeName(obj){
    //     this.fakeName = obj;
    // }

    changeVideoState() {
        if (this.videoState == '取消視訊') {
            this.videoState = '視訊';
            this.videoImg = 'video-on';
            this.videoSrc = { visibility: 'hidden' };
        } else {
            this.videoState = '取消視訊';
            this.videoImg = 'video-off';
            this.videoSrc = { visibility: 'visible' };
        }
    }

    changeAudioState() {
        if (this.audioState == '靜音') {
            this.audioState = "說話"
            this.audioImg = 'audio-off';
            this.VideoAudio= 'VideoUser-audio-off';
        } else {
            this.audioState = '靜音';
            this.audioImg = 'audio-on';
            this.VideoAudio= 'VideoUser-audio-on';
        }
    }

    changeInviteState() {
        if (this.inviteState == 'invite_detail_off') {
            this.inviteState = 'invite_detail_on';
        } else {
            this.inviteState = 'invite_detail_off';
        }
    }
    changeVideoReadyState() {
        if (this.isStreaming) {
            this.videoIsReady = false;
        }
        this.isStreaming = !this.isStreaming;
    }

    changeAgendaState() {
        if (this.agendaState == 'nowagenda-off') {
            this.agendaState = 'nowagenda-on';
            this.agendaImg = 'agenda-off';
        } else {
            this.agendaState = 'nowagenda-off';
            this.agendaImg = 'agenda-on';
        }
    }

    gotLocalVideo(videoURL) {
        this.localVideoURL = videoURL;
    }

    updateResult({ temp, final }) {
        this.interim_result = temp;
        this.final_result = final;
    }

    //按下F5、或關閉視窗時觸發
    userLeft(id) {
        if (this.remoteStreamURL[id]) {
            delete this.remoteStreamURL[id];
        }
        delete this.connections[id];
        //delete this.fakeName[id];
    }

    newParticipant(object) {
        this.connections[object.a] = object.b;
    }
    addRemoteStreamURL(obj) {
        this.remoteStreamURL[obj.a] = obj.b;
    }
    queueCandidate(obj) {
        this.candidateQueue[obj.b] = obj.a;
    }

    addAgenda(data) {
        this.agendaList[data] = data;
        socket.emit('addAgenda', this.agendaList);
    }

    deleteAgenda(data) {
        delete this.agendaList[data];
        socket.emit('deleteAgenda', this.agendaList);
    }

    listenAgenda(data) {
            this.agendaList = data;
        }
        //0514 07:41 +1Update
    Updatetext(obj) {
            this.mychattext = obj;
            this.mychatstatus = true;
        }
        //0514 07:41 +1End

    receiveMsg(msg) {
        this.otherchattext = JSON.parse(msg);
    }

    RandomBrain(){
        this.Hatnumber = Math.floor(Math.random() * 6) + 1  ;
        if(this.Hatnumber==1) this.ColorHat = this.WhiteHat;
        if(this.Hatnumber==2) this.ColorHat = this.GreenHat;
        if(this.Hatnumber==3) this.ColorHat = this.BlueHat;
        if(this.Hatnumber==4) this.ColorHat = this.RedHat;
        if(this.Hatnumber==5) this.ColorHat = this.BlackHat;
        if(this.Hatnumber==6) this.ColorHat = this.YellowHat;
        this.BrainHat= '../img/'+this.Hatnumber+'.png';
    };

    changeBrainstormingState(){
        if(this.brainImg=='brainstorming-on'){
            this.RandomBrain();
            this.brainImg='brainstorming-off';
            this.BrainState='brainbox-on';
        } else {
            this.brainImg='brainstorming-on';
            this.BrainState='brainbox-off';
        }
    }


    onGetSystemTimeSuccess(data){
        this.systemTime = data ; //將時間指派給傳來的值
    }
}

export default alt.createStore(MeetingStore);
