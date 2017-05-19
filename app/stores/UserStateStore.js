import alt from '../alt';
import UserStateActions from '../actions/UserStateActions';

class UserStateStore {
  constructor(){
    this.bindActions(UserStateActions);
    this.userName = '';
    this.userImgURL = '';
    this.Online = '';
  }

    onGetUserNameSuccess(data) {
      this.userName = data.name;
  }

  //   onGetUserImgSuccess(imgURL) {
  //     this.userImgURL = imgURL;
  // }

  //   onGetUserImgFail(data) {
  //     alert('Fail');
  // }

    onGetOnlineSuccess(data) {
    this.Online = data.status;
  }

  //   onGetOnlineFail(data) {
  //     alert('Fail');
  // }
}

export default alt.createStore(UserStateStore);