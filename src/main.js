import "babel-polyfill";
import React from "react";
import ReactDOM from "react-dom";
import roomList from "./reducers/roomList";
import participantList from "./reducers/participantList";
import connection from "./reducers/connection";
import { createStore, combineReducers } from "redux";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { Switch } from "react-router";
import { Provider } from "react-redux";
import Index from "./components/Index";
import Meeting from "./components/Meeting"

let reducers = combineReducers({
	roomList,
	participantList,
	connection
});

const store = createStore(
	reducers,
	window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

ReactDOM.render(
	<Provider store={store}>
		<Router>
			<Switch>
				<Route exact path="/" component={Index} />
				<Route path="/meeting" component={Meeting} />
			</Switch>
		</Router>
	</Provider>,
	document.getElementById("app")
);
