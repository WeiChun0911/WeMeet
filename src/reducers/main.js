import alt from '../alt';
import MainActions from '../actions/MainActions';

class MainStore {
    constrcutor() {
        this.bindActions(MainActions);
        this.roomName = '';
    }
    saveRoomName(name){
    	this.roomName = name;
    }

}

export default alt.createStore(MainStore);
