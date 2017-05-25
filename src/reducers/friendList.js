const initialState = {
    userList = [],
    roomList = []
}

export default function friendList(state = initialState, action) {
  switch (action.type) {
    case 'setUserList':
        return state.userList.concat(action.data);
    case 'setRoomList':
        return state.roomList.concat(action.data);
    default:
      return state
  }
}
