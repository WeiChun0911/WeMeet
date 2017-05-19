import alt from '../alt';
import FriendListActions from '../actions/FriendListActions';

class FriendListStore {
    constructor() {
        this.bindActions(FriendListActions);
        this.userList = [];
        this.roomList = [];
    }

    setUserList(data) {
        this.userList = data;
    }

    setRoomList(data){
    	this.roomList = data;
    }

}

export default alt.createStore(FriendListStore);
