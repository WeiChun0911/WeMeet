var client;
var request;
var transcripe = document.getElementById("transcripe");

function useMic() {
    return document.getElementById("useMic").value;
}

function getMode() {
    return Microsoft.CognitiveServices.SpeechRecognition.SpeechRecognitionMode.shortPhrase;
}

function getKey() {
    return document.getElementById("key").value;
}

function getLanguage() {
    return "zh-TW";
}

function setText(text) {
    document.getElementById("output").value += text;
}

/* For LUIS
function getLuisConfig() {
    var appid = document.getElementById("luis_appid").value;
    var subid = document.getElementById("luis_subid").value;

    if (appid.length > 0 && subid.length > 0) {
        return { appid: appid, subid: subid };
    }

    return null;
}
*/

function start() {
    transcripe.textContent = "啟動服務中，請稍後";
    var mode = getMode();

    //var luisCfg = getLuisConfig();

    if (useMic()) {
        console.log("Using Mic");
        // if (luisCfg) {
        //     client = Microsoft.CognitiveServices.SpeechRecognition.SpeechRecognitionServiceFactory.createMicrophoneClientWithIntent(
        //         getLanguage(),
        //         getKey(),
        //         luisCfg.appid,
        //         luisCfg.subid);
        // } else {
        client = Microsoft.CognitiveServices.SpeechRecognition.SpeechRecognitionServiceFactory.createMicrophoneClient(
            mode,
            getLanguage(),
            getKey()
        );
        //}
        client.startMicAndRecognition();
        transcripe.textContent = "請開始說話，共5秒時間";
        setTimeout(function() {
            transcripe.textContent = "Start";
            client.endMicAndRecognition();
        }, 5000);
    } else {
        // if (luisCfg) {
        //     client = Microsoft.CognitiveServices.SpeechRecognition.SpeechRecognitionServiceFactory.createDataClientWithIntent(
        //         getLanguage(),
        //         getKey(),
        //         luisCfg.appid,
        //         luisCfg.subid);
        // } else {
        client = Microsoft.CognitiveServices.SpeechRecognition.SpeechRecognitionServiceFactory.createDataClient(
            mode,
            getLanguage(),
            getKey());
        //}
        request = new XMLHttpRequest();
        request.open(
            'GET',
            (mode == Microsoft.CognitiveServices.SpeechRecognition.SpeechRecognitionMode.shortPhrase) ? "whatstheweatherlike.wav" : "batman.wav",
            true);
        request.responseType = 'arraybuffer';
        request.onload = function() {
            if (request.status !== 200) {
                setText("unable to receive audio file");
            } else {
                client.sendAudio(request.response, request.response.length);
            }
        };
        request.send();
    }

    client.onPartialResponseReceived = function(response) {
        setText(response);
        console.log("PartialResponseReceived");
    }

    client.onFinalResponseReceived = function(response) {
        setText(JSON.stringify(response));
        console.log("FinalResponseReceived");
    }

    client.onIntentReceived = function(response) {
        setText(response);
        console.log("IntentReceived");
    };
}
