import alt from '../alt';
import HistoryActions from '../actions/HistoryActions';

class HistoryStore {
    constrcutor() {
        this.bindActions(HistoryActions);
        this.historyList = [];
        this.userList = [];
    }
    setHistory(Array) {
    	this.historyList = Array;
    }


}

export default alt.createStore(HistoryStore);
