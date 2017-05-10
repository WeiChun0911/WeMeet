'use strict';

let Recognition = {
    createNew: (htmlObj, callback) => {
        //data
        let langs = [
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
        //模組物件
        let recognizer = {};
        //模組接口的需求:Select選單物件、中途判定之文字輸出口、最終結果文字輸出口
        let { select_language, select_dialect } = htmlObj;

        let final_transcript = '';
        let recognizing = false;
        let ignore_onend;
        let start_timestamp;

        let recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        for (let i = 0; i < langs.length; i++) {
            select_language.options[i] = new Option(langs[i][0], i);
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
            if (recognizing) {
                recognition.stop();
                return;
            }
            final_transcript = '';
            recognition.lang = select_dialect.value;
            recognition.start();
            ignore_onend = false;
            start_timestamp = event.timeStamp;
        };

        recognition.onstart = () => {
            recognizing = true;
            alert('按下麥克風圖示，並開始說話。');
        };

        recognition.onerror = (event) => {
            if (event.error == 'no-speech') {
                alert('偵測不到麥克風訊號，請調整裝置的設定。');
                ignore_onend = true;
            }
            if (event.error == 'audio-capture') {
                alert('偵測不到麥克風，請正確安裝。');
                ignore_onend = true;
            }
            if (event.error == 'not-allowed') {
                if (event.timeStamp - start_timestamp < 100) {
                    alert('麥克風的權限被阻擋，請至chrome://settings/contentExceptions#media-stream更改設定');
                } else {
                    alert('存取麥克風被拒。');
                }
                ignore_onend = true;
            }
        };

        recognition.onend = () => {
            recognizing = false;
            if (ignore_onend) {
                return;
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

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            final_transcript = capitalize(final_transcript);
            callback(interim_transcript, final_transcript);
        };
        return recognizer;
    }
};

module.exports = Recognition;
