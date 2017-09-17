import React from "react";
import { setRoomList, addRoom, delRoom } from "../actions/Actions";
// import FriendListStore from '../stores/FriendListStore';
// import FriendListActions from '../actions/FriendListActions';
import socket from "../socket";
import { connect } from "react-redux";
import { withRouter } from "react-router";

class RoomList extends React.Component {
    constructor(props) {
        super(props);
        this.roomName = "";
    }

    componentDidMount() {

        // socket.on("setRoomList", list => {
        //     if (list.length) {
        //         this.props.dispatch(setRoomList(list));
        //     }
        // });

        // socket.on("addRoom", room => {
        //     this.props.dispatch(addRoom(room));
        // });

        // socket.on("delRoom", room => {
        //     this.props.dispatch(delRoom(room));
        // });
    }

    componentWillUnmount(){
        console.error("打你爸爸殺你叔叔")
        //socket.removeAllListeners()
    }
    //按下enter後的事件處理
    handleCreateRoom_Enter(e) {
        if (this.refs.roomNum.value) {
            if (e.charCode == 13) {
                e.preventDefault();
                this.roomName = this.refs.roomNum.value;
                this.props.history.push("/meeting#" + this.roomName);
            }
        } else {
            if (e.charCode == 13) {
                e.preventDefault();
                let r = confirm("你沒有輸入房名喔! 我們給你一組亂碼好嗎?");
                if (r == true) {
                    this.props.history.push("/meeting#" + this.roomName);
                }
            }
        }
    }

    handleCreateRoom_Click(e) {
        if (this.refs.roomNum.value) {
            e.preventDefault();
            this.roomName = this.refs.roomNum.value;
            this.props.history.push("/meeting#" + this.roomName);
        } else {
            let r = confirm("你沒有輸入房名喔! 我們給你一組亂碼好嗎?");
            if (r == true) {
                this.props.history.push("/meeting#" + this.roomName);
            } else {
                e.preventDefault();
            }
        }
    }

    handleJoinRoom(room) {
        this.props.history.push("/meeting" + room);
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
                        onClick={()=>{this.handleJoinRoom(room)}}
                    >
                        {room}
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
                                onKeyPress={e=>{
                                    this.handleCreateRoom_Enter(e);
                                }}
                            />
                        </div>
                        <div id="AddGo">
                            <img
                                id="Addgo"
                                src="../img/index_go1.png"
                                onClick={e => {
                                    this.handleCreateRoom_Click(e);
                                }}
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

export default withRouter(connect(mapStateToProps)(RoomList));
