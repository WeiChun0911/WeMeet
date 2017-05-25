import alt from '../alt';

class UserStateActions {
    constructor() {
        this.generateActions(
            'getUserImgSuccess',
            'getUserImgFail',
            'getUserNameSuccess',
            'getUserNameFail',
            'getOnlineSuccess',
            'getOnlineFail'
        );
    }
}

export default alt.createActions(UserStateActions);
