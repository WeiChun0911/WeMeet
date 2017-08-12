const initialState = {
    historyList = []
}

class HistoryStore {
    constrcutor() {
        this.bindActions(HistoryActions);
        this.historyList = [];
    }
    setHistory(Array) {
    	this.historyList = Array;
}

const initialState = {
    userList = [],
    roomList = []
}

export default function history(state = initialState, action) {
  switch (action.type) {
    case 'setHistory':
        return state.userList.concat(action.data);

    default:
      return state
  }
}
