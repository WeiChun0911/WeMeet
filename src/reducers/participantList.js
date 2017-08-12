const initialState = []

export default function participantList(state = initialState, action) {
    switch (action.type) {
    	case "setParticipantList":
    		return action.data;

    	case "delParticipant":
            return state.filter((id)=>{
            	return id !== action.data
            });

        case "addParticipant":
            return state.concat(action.data);

        default:
            return state;
    }
}
