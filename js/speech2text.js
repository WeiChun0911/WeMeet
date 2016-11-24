var client;
var request;

function useMic() {
    return document.getElementById("useMic").value;
}

function getMode() {
    return Microsoft.CognitiveServices.SpeechRecognition.SpeechRecognitionMode.shortPhrase;
}

function getKey1() {
    return document.getElementById("key1").value;
}

function getKey2() {
    return document.getElementById("key2").value;
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

function stopRecognition(){
    client.endMicAndRecognition();
}

function startRecognition() {
    var mode = getMode();
    //var luisCfg = getLuisConfig();

    if (useMic()=="true") {
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
            getKey1(),
            getKey2()
        );
        //}
        client.startMicAndRecognition();
    } else {
        console.log("Using File");
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
            getKey1(),
            getKey2()
            );
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
        console.log(response);
        console.log("PartialResponseReceived");
    }

    client.onFinalResponseReceived = function(response) {
        setText(JSON.stringify(response));
        console.log(response);
        console.log("FinalResponseReceived");
    }

    client.onIntentReceived = function(response) {
        setText(response);
        console.log(response);
        console.log("IntentReceived");
    };
    client.onError = function(response) {
        setText(response);
        console.log(response);
        console.log("ERROR");
    };
}
