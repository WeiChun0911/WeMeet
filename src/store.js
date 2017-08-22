import { createStore, combineReducers } from "redux";
import {roomList,participantList,connection} from "./reducers"

let reducers = combineReducers({
	roomList,
	participantList,
	connection
});


const store = createStore(
	reducers,
	window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)

export default store