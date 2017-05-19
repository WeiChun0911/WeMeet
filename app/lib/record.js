let Recorder = {　　　　
    createNew: (source) => {　　　　　　
        let recorder = {};　　　　　
        let mediaRecorder;
        let recordedBlobs;
        let sourceBuffer;

        let { recordedVideo, recordButton, playButton, downloadButton } = source;

        recordedVideo.addEventListener('error', (ev) => {
            console.error('MediaRecording.recordedMedia.error()');
            alert('Your browser can not play\n\n' + recordedVideo.src + '\n\n media clip. event: ' + JSON.stringify(ev));
        }, true);
        recordButton.onclick = toggleRecording;
        playButton.onclick = play;
        downloadButton.onclick = download;　　　　

        let handleSourceOpen = (event) => {
            console.log('MediaSource opened');
            sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
            console.log('Source buffer: ', sourceBuffer);
        }

        let handleDataAvailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedBlobs.push(event.data);
            }
        }

        let handleStop = (event) => {
            console.log('Recorder stopped: ', event);
        }

        let toggleRecording = () => {
            if (recordButton.textContent === 'Start Recording') {
                startRecording();
            } else {
                stopRecording();
                recordButton.textContent = 'Start Recording';
                playButton.disabled = false;
                downloadButton.disabled = false;
            }
        }

        // The nested try blocks will be simplified when Chrome 47 moves to Stable
        let startRecording = () => {
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
            recordButton.textContent = 'Stop Recording';
            playButton.disabled = true;
            downloadButton.disabled = true;
            mediaRecorder.onstop = handleStop;
            mediaRecorder.ondataavailable = handleDataAvailable;
            mediaRecorder.start(10); // collect 10ms of data
            console.log('MediaRecorder started', mediaRecorder);
        }

        let stopRecording = () => {
            mediaRecorder.stop();
            console.log('Recorded Blobs: ', recordedBlobs);
            recordedVideo.controls = true;
        }

        let play = () => {
            let superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
            recordedVideo.src = window.URL.createObjectURL(superBuffer);
        }

        let download = () => {
            let blob = new Blob(recordedBlobs, { type: 'video/webm' });
            let url = window.URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'test.webm';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        }

        let upload = () => {
            let blob = new Blob(recordedBlobs, { type: 'video/webm' });
            socket.emit('videoToDB', blob)
        }
        return recorder;　　　
    }　　
};

module.exports = Recorder;
