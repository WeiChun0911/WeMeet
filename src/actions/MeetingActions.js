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
}

export default alt.createActions(MeetingActions);