"use strict";

// 'getSystemTimeSuccess',
//       'changeAudioState',
//       'changeRecognizeState',
//       'changeVideoState',
//       'changeInviteState',
//       'Updatetext',
//       'changeVideoReadyState',
//       'updateResult',
//       'addAgenda',
//       'deleteAgenda',
//       'listenAgenda',
//       'userLeft',
//       'addRemoteStreamURL',
//       'queueCandidate',
//       'changeAgendaState',
//       'receiveMsg',
//       'changeBrainstormingState',
//       'RandomBrain'

export function setParticipantList(participantList) {
	return {
		type: "setParticipantList",
		data: participantList
	};
}


export function addParticipantList(participantID) {
	return {
		type: "addParticipantList",
		data: participantID
	};
}

export function delParticipantList(participantID) {
	return {
		type: "delParticipantList",
		data: participantID
	};
}

export function setRoomList(roomList) {
	return {
		type: "setRoomList",
		data: roomList
	};
}

export function addRoom(room) {
	return {
		type: "addRoom",
		data: room
	};
}

export function delRoom(room) {
	return {
		type: "delRoom",
		data: room
	};
}



export function gotLocalVideo(url) {
	return {
		type: "gotLocalVideo",
		data: url
	}
}

export function addParticipantConnection(participantObj){
	return {
		type:"addParticipantConnection",
		data: participantObj
	}
}

export function delParticipantConnection(participantObj){
	return {
		type:"delParticipantConnection",
		data: participantObj
	}
}

export function addRemoteStreamURL(streamObj){
	return {
		type:"addRemoteStreamURL",
		data: streamObj
	}
}

export function delRemoteStreamURL(id){
	return {
		type:"delRemoteStreamURL",
		data:id
	}
}
