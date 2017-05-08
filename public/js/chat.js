'use strict';

let Chat = {
    createNew: (htmlObj) => {
        let Chat = {};
        let { localVideo, dataChannelSend, dataChannelReceive, msgButton, fileInput, downloadAnchor, sendToUser, sendToDB } = htmlObj;
        let remoteVideo = {};
        let receiveBuffer = [];

        sendToUser.addEventListener('click', sendFileToUser);
        sendToDB.addEventListener('click', sendFileToDB);
        msgButton.addEventListener('click', sendText);

        let isInitiator = false;
        let isStarted = false;
        let room = window.location.hash.substring(12);
        let socket = io.connect("https://140.123.175.95:8787");
        let localUserID;
        let connections = {};
        let remoteStream = {};
        let fileChannels = {};
        let msgChannels = {};








        return Chat;
    }
};

module.exports = Chat;
