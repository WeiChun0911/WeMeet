import React from "react";
import { setRoomList,addRoom,delRoom } from "../actions/Actions";
// import FriendListStore from '../stores/FriendListStore';
// import FriendListActions from '../actions/FriendListActions';
import socket from "../socket";
import { connect } from "react-redux";

class RoomList extends React.Component {
    constructor(props) {
        super(props);
        this.roomName = "";
        this.meetingURL = "http://localhost:8787/meeting#";
    }

    componentDidMount() {
        socket.on("setRoomList", list => {
            if (list.length) {
                this.props.dispatch(setRoomList(list));
            }
        });

        socket.on("addRoom", room => {
           this.props.dispatch(addRoom(room));
        });

        socket.on("delRoom", room => {
            this.props.dispatch(delRoom(room));
        });
    }

    componentWillMount() {}

    //按下enter後的事件處理
    handleCreateRoom_Enter(e) {
        if (this.refs.roomNum.value) {
            if (e.charCode == 13) {
                e.preventDefault();
                this.roomName = this.refs.roomNum.value;
                window.location.href =
                    this.meetingURL + this.refs.roomNum.value;
            }
        } else {
            if (e.charCode == 13) {
                e.preventDefault();
                let r = confirm("你沒有輸入房名喔! 我們給你一組亂碼好嗎?");
                if (r == true) {
                    window.location.href = this.meetingURL;
                }
            }
        }
    }

    handleCreateRoom_Click() {
        if (this.refs.roomNum.value) {
            this.roomName = this.refs.roomNum.value;
            window.location.href = this.meetingURL + this.refs.roomNum.value;
        } else {
            let r = confirm("你沒有輸入房名喔! 我們給你一組亂碼好嗎?");
            if (r == true) {
                window.location.href = this.meetingURL;
            }
        }
    }

    handleJoinRoom(room) {
        window.location.href = this.meetingURL + this.refs.roomNum.value;
    }

    render() {
        let room = this.props.roomList.map(room => {
            return (
                <div id="roomProp">
                    <div id="circle3">
                        <img id="friend_image" src="../img/room.png" />
                    </div>
                    <div
                        id="room_name"
                        onClick={this.handleJoinRoom.bind(this)}
                    >
                        {room.substring(30)}
                    </div>
                </div>
            );
        });
        return (
            <div id="in">
                <div className="ChatList">
                    <div id="AddRoom">
                        <label id="Addtext">建立房間？請輸入想要的房號</label>
                        <div id="AddInput">
                            <input
                                className="Addinputsyle"
                                type="text"
                                ref="roomNum"
                                id="input-10"
                                onKeyPress={this.handleCreateRoom_Enter.bind(
                                    this
                                )}
                            />
                        </div>
                        <div id="AddGo">
                            <img
                                id="Addgo"
                                src="../img/index_go1.png"
                                onClick={this.handleCreateRoom_Click.bind(this)}
                            />
                        </div>
                    </div>
                    <div id="chatlist_text">現有房間清單</div>
                    <div id="chatlist_online">
                        {room}
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        roomList: state.roomList
    };
};

export default connect(mapStateToProps)(RoomList);
