'use strict';

let Recognition = {
    createNew: (MeetingActions, MeetingStore, socket, room) => {
        //模組物件
        let recognizer = {};

        //模組接口的需求:Select選單物件、中途判定之文字輸出口、最終結果文字輸出口
        let final_transcript = '';
        let ignore_onend;
        let start_timestamp;
        recognizer.id = '';

        let recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognizer.setLanguage = (dialect) => {
            console.log(dialect.value);
            recognition.lang = dialect.value;
        }

        let two_line = /\n\n/g;
        let one_line = /\n/g;

        let first_char = /\S/;

        let capitalize = (s) => {
            return s.replace(first_char, (m) => {
                return m.toUpperCase();
            });
        };

        recognizer.toggleButtonOnclick = () => {
            if (MeetingStore.state.isRecognizing) {
                recognition.stop();
                MeetingActions.changeRecognizeState();
            } else {
                final_transcript = '';
                ignore_onend = false;
                start_timestamp = event.timeStamp;
                recognition.start();
                MeetingActions.changeRecognizeState();
            }
        }

        recognition.onerror = (event) => {
            if (event.error == 'no-speech') {
                alert('偵測不到麥克風訊號，請調整裝置的設定。');
                recognition.stop();
            }
            if (event.error == 'audio-capture') {
                alert('偵測不到麥克風，請正確安裝。');
                ignore_onend = true;
                recognition.stop();
            }
            if (event.error == 'not-allowed') {
                if (event.timeStamp - start_timestamp < 100) {
                    alert('麥克風的權限被阻擋，請至chrome://settings/contentExceptions#media-stream更改設定');
                } else {
                    alert('存取麥克風被拒。');
                }
                ignore_onend = true;
                recognition.stop();
            }
            MeetingActions.changeRecognizeState();
        };

        recognition.onend = () => {
            if (MeetingStore.state.isRecognizing) {
                MeetingActions.changeRecognizeState();
            }
        };

        recognition.onresult = (event) => {
            let interim_transcript = '';
            //版本過舊的情況
            if (typeof(event.results) == 'undefined') {
                recognition.onend = null;
                recognition.stop();
                return;
            }
            let meetingHistory = [];
            let date = new Date();
            let time = date.getTime();
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    console.log(recognizer.id);
                    socket.emit('history', JSON.stringify({
                        'time': time,
                        'name': recognizer.id,
                        'value': event.results[i][0].transcript
                    }), room);
                    final_transcript = event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            MeetingActions.updateResult({
                temp: interim_transcript,
                final: final_transcript
            });
        }
        return recognizer;
    }
};

module.exports = Recognition;
