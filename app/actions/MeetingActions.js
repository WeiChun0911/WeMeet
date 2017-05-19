import alt from '../alt';

class MeetingActions {
  constructor() {
    this.generateActions(
      'getSystemTimeSuccess',
      'changeAudioState',
      'changeRecognizeState',
      'changeVideoState',
      'changeInviteState',
      'Updatetext',
      'changeVideoReadyState',
      'gotLocalVideo',
      'newParticipant',
      'updateResult',
      'addAgenda',
      'deleteAgenda',
      'listenAgenda',
      'userLeft',
      'addRemoteStreamURL',
      'queueCandidate',
      'changeAgendaState',
      'receiveMsg',
      'changeBrainstormingState',
      'RandomBrain'
    );
  }
  
  getSystemTime() {
      let d = new Date();
      d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
      this.actions.getSystemTimeSuccess(d);
  }
}

export default alt.createActions(MeetingActions);