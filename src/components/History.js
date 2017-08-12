import React from "react";
// import HistoryStore from "../stores/HistoryStore";
// import HistoryActions from "../actions/HistoryActions";
import socket from "../socket";
//import FriendList from "./FriendList";
import IndexLogo from "./IndexLogo";

let room = window.location.hash;
class History extends React.Component {
	constructor(props) {
		super(props);
		this.state = HistoryStore.getState();
		this.onChange = this.onChange.bind(this);
		this.result = [];
	}

	componentWillMount() {}

	componentDidMount() {
		HistoryStore.listen(this.onChange);
		console.log(room);
		socket.emit("getHistory", room);
		socket.on("onHistoryResult", resultArray => {
			this.result = resultArray;
			this.state = this.setState({});
		});
	}

	componentWillUnmount() {
		HistoryStore.unlisten(this.onChange);
	}

	onChange(state) {
		this.setState(state);
	}

	render() {
		let sortedList = this.result.sort((a, b) => {
			if (a.time > b.time) {
				return 1;
			}
			if (a.time < b.time) {
				return -1;
			}
			// a must be equal to b
			return 0;
		});
		let list = [];
		sortedList.map(obj => {
			let d = new Date(JSON.parse(obj.history).time);
			let time = d.toLocaleString();
			list.push(
				<p>
					時間:
					{time}
					{JSON.parse(obj.history).name}:
					{JSON.parse(obj.history).value}
				</p>
			);
		});
		return (
			<div id="in">
				<IndexLogo />
				<FriendList />
				<div className="box-b">
					<div id="in">
						<div id="meet_list">
							<table id="list">
								<tbody>
									<tr>
										<td>
											會議成員：
										</td>
										<td>
											佳怡、威君、成財、騰輝
										</td>
									</tr>
									<tr>
										<td>
											會議紀錄：
										</td>
										<td>
											{list}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default History;
