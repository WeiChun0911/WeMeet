const initialState = []

export default function participantList(state = initialState, action) {
    switch (action.type) {
    	case "setParticipantList":
    		return action.data;

    	case "delParticipantList":
            return state.filter((id)=>{
            	return id !== action.data
            });

        case "addParticipantList":
            return state.concat(action.data);

        default:
            return state;
    }
}
