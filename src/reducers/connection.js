const initialState = {
    localUserID:"",
    localVideoURL:"",
    connections : {}, //存放連線中的人的socket.id
    remoteStreamURL : {} //存放連線中的人的stream
}

export default function connection(state = initialState, action) {
    switch (action.type) {
        case "setLocalUserID":
            return Object.assign({},state,{localUserID:action.data})
        case "gotLocalVideo":
            return Object.assign({},state,{localVideoURL:action.data})
        case "newParticipant":
            return {...state,connections:{...state.connections,[action.data.id]:[action.data.connectionObj]}}
        case "addRemoteStreamURL":
            return Object.assign({},state,action.data)
        default:
            return state;
    }
}



