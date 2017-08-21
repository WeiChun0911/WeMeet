const initialRoomList = []

export default function roomList(state = initialRoomList, action) {
    switch (action.type) {
        case "setRoomList":
            return action.data;

        case "addRoom":
            return state.concat(action.data);

        case "delRoom":
            return state.filter((room)=>{
            	return room !== action.data
            })

        default:
            return state;
    }
}
