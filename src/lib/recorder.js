export default class Recorder {
    constructor() {
        this.isRecording = true;
        this.recordedBlobs = [];
        this.toggleRecording = this.toggleRecording.bind(this)
        this.download = this.download.bind(this)
        this.play = this.play.bind(this)
        this.upload = this.upload.bind(this)
    }
    setStream(stream) {
        this.stream = stream
        this.streamUrl = window.URL.createObjectURL(stream)
    }
    toggleRecording() {
        if (!this.isRecording) {
            this._startRecording();
        } else {
            this._stopRecording();
        }
    }
    download() {
        let blob = new Blob(this.recordedBlobs, { type: 'video/webm' });
        let url = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'test.webm';
        a.click();
        window.URL.revokeObjectURL(url);
    }
    play() {
        let superBuffer = new Blob(this.recordedBlobs, { type: 'video/webm' });
        this.streamUrl = window.URL.createObjectURL(superBuffer);
        this.isPlaying = true
    }
    upload(socket) {
        let blob = new Blob(this.recordedBlobs, { type: 'video/webm' });
        socket.emit('videoToDB', blob)
    }

    _startRecording() {
        let { stream, video } = this
        let options = { mimeType: 'video/webm' };
        let mediaRecorder
            // this.recordedBlobs = [];
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e0) {
            console.log('Unable to create MediaRecorder with options Object: ', e0);
            try {
                options = { mimeType: 'video/webm,codecs=vp9' };
                mediaRecorder = new MediaRecorder(stream, options);
            } catch (e1) {
                console.log('Unable to create MediaRecorder with options Object: ', e1);
                try {
                    options = 'video/vp8'; // Chrome 47
                    mediaRecorder = new MediaRecorder(stream, options);
                } catch (e2) {
                    alert('MediaRecorder is not supported by this browser.\n\n' +
                        'Try Firefox 29 or later, or Chrome 47 or later, with Enable experimental Web Platform features enabled from chrome://flags.');
                    console.error('Exception while creating MediaRecorder:', e2);
                    return;
                }
            }
        }
        console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
        mediaRecorder.onstop = this._handleStop.bind(this);
        mediaRecorder.ondataavailable = this._handleDataAvailable.bind(this);
        mediaRecorder.start(10); // collect 10ms of data

        this.mediaRecorder = mediaRecorder
        this.isRecording = true
        console.log('MediaRecorder started', this.mediaRecorder);
    }
    _stopRecording() {
        this.mediaRecorder.stop();
        this.isRecording = false
        console.log('Recorded Blobs: ', this.recordedBlobs);
    }
    _handleDataAvailable(event) {
        if (event.data && event.data.size > 0) {
            this.recordedBlobs.push(event.data);
        }
    }
    _handleStop(event) {
        console.log('Recorder stopped: ', event);
    }

}
