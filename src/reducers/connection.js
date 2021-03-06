const initialState = {
    localUserID: "",
    localVideoURL: "",
    remoteStreamURL: {}, //存放連線中的人的stream
};

export default function connection(state = initialState, action) {
    switch (action.type) {
        case "setLocalUserID":
            return Object.assign({}, state, { localUserID: action.data });
        case "gotLocalVideo":
            return Object.assign({}, state, { localVideoURL: action.data });
            
        case "addParticipantConnection":
            return {
                ...state,
                connections: {
                    ...state.connections,
                    [action.data.id]: action.data.connectionObj
                }
            };
        case "delParticipantConnection":
            return Object.assign({}, state, {
                connections: Object.keys(
                    state.connections
                ).reduce((result, key) => {
                    if (key !== action.data) {
                        result[key] = state.connections[key];
                    }
                    return result;
                }, {})
            });
        case "addCandidateQueue":
        //如果已經有這個人的屬性，就把物件填進陣列裡
            if(state.candidateQueue[action.data.id]){
                return {
                    ...state,
                    candidateQueue: {
                        ...state.candidateQueue,
                        [action.data.id]: [
                            ...state.candidateQueue[action.data.id],
                            action.data.candidate
                        ]
                    }
                };
            } else {
                return {
                    ...state,
                    candidateQueue: {
                        ...state.candidateQueue,
                        [action.data.id]: [action.data.candidate]
                    }
                };
            }
            
        case "addRemoteStreamURL":
            return {
                ...state,
                remoteStreamURL: {
                    ...state.remoteStreamURL,
                    [action.data.id]: action.data.url
                }
            };

        case "delRemoteStreamURL":
            return Object.assign({}, state, {
                remoteStreamURL: Object.keys(
                    state.remoteStreamURL
                ).reduce((result, key) => {
                    if (key !== action.data) {
                        result[key] = state.remoteStreamURL[key];
                    }
                    return result;
                }, {})
            });
        default:
            return state;
    }
}
