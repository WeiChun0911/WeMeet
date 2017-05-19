import alt from '../alt';

class FriendListActions {
  constructor() {
    this.generateActions(
    	'setRoomList',
    	'setUserList'
    );
  } 

}

export default alt.createActions(FriendListActions);
