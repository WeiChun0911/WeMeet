'use strict';

let Recorder = {　　　　
    createNew: (source) => {　　　　　　
        let recorder = {};　　　　　
        let mediaRecorder;
        let recordedBlobs;
        let sourceBuffer;
        let isRecording = false;
        let { mediaSource, recordedVideo } = source;

        let handleSourceOpen = () => {
            sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
            console.log('Source buffer: ', sourceBuffer);
        };

        mediaSource.addEventListener('sourceopen', handleSourceOpen, false);

        let handleDataAvailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedBlobs.push(event.data);
            }
        };

        let handleStop = (event) => {
            console.log('Recorder stopped: ', event);
        };

        recorder.toggleButtonOnclick = () => {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        };

        // The nested try blocks will be simplified when Chrome 47 moves to Stable
        let startRecording = () => {
            isRecording = true;
            let options = { mimeType: 'video/webm' };
            recordedBlobs = [];
            try {
                mediaRecorder = new MediaRecorder(window.stream, options);
            } catch (e0) {
                console.log('Unable to create MediaRecorder with options Object: ', e0);
                try {
                    options = { mimeType: 'video/webm,codecs=vp9' };
                    mediaRecorder = new MediaRecorder(window.stream, options);
                } catch (e1) {
                    console.log('Unable to create MediaRecorder with options Object: ', e1);
                    try {
                        options = 'video/vp8'; // Chrome 47
                        mediaRecorder = new MediaRecorder(window.stream, options);
                    } catch (e2) {
                        alert('MediaRecorder is not supported by this browser.\n\n' +
                            'Try Firefox 29 or later, or Chrome 47 or later, with Enable experimental Web Platform features enabled from chrome://flags.');
                        console.error('Exception while creating MediaRecorder:', e2);
                        return;
                    }
                }
            }
            console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
            mediaRecorder.onstop = handleStop;
            mediaRecorder.ondataavailable = handleDataAvailable;
            mediaRecorder.start(10); // collect 10ms of data
            console.log('MediaRecorder started', mediaRecorder);
        };

        let stopRecording = () => {
            isRecording = false;
            mediaRecorder.stop();
            recordedVideo.controls = true;
        };

        recorder.playButtonOnclick = (callback) => {
            let superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
            callback(window.URL.createObjectURL(superBuffer));
        };

        recorder.downloadButtonOnclick = () => {
            let blob = new Blob(recordedBlobs, { type: 'video/webm' });
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            let d = new Date();
            d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2);
            a.download = d + '.webm';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        };

        recorder.uploadButtonOnclick = (callback) => {
            let blob = new Blob(recordedBlobs, { type: 'video/webm' });
            var xhr = new XMLHttpRequest();
            xhr.open("POST", 'https://140.123.175.95:8787/api/db/create/register', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify({
                video: blob
            }));
            callback();
        };
        return recorder;　　　
    }　　
};

module.exports = Recorder;
