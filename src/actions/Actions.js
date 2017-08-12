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


export function addParticipant(participantObj) {
	return {
		type: "addParticipant",
		data: participantObj
	};
}

export function delParticipant(participantObj) {
	return {
		type: "delParticipant",
		data: participantObj
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

export function newParticipant(participantObj){
	return {
		type:"newParticipant",
		data: participantObj
	}
}
