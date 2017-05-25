import React from 'react';
import FriendListStore from '../stores/FriendListStore';
import FriendListActions from '../actions/FriendListActions';
import socket from '../socket';


class ChatList extends React.Component {
    constructor(props) {
        super(props);
        this.state = FriendListStore.getState();
        this.onChange = this.onChange.bind(this);
        this.roomName = '';
    }

    componentDidMount() {
        FriendListStore.listen(this.onChange);
        socket.on('newRoom',(list)=>{
            FriendListActions.setRoomList(list);
        })
    }

    componentWillUnmount() {
        FriendListStore.unlisten(this.onChange);
    }

    onChange(state) {
        this.setState(state);
    }

    //按下enter後的事件處理
    handleTest(e) {
        if (e.charCode == 13) {
            event.preventDefault();
            this.roomName = this.refs.roomnum.value;
            window.location.href = 'https://140.123.175.95:8787/meeting#' + this.refs.roomnum.value;
        }

    }

    handleOnClick() {
        this.roomName = this.refs.roomnum.value;
        window.location.href = 'https://140.123.175.95:8787/meeting#' + this.refs.roomnum.value;
    }


    render() {
        let room = this.state.roomList.map((room) => {
            let roompage = '/meet' + room;
            return (
                <a href={roompage}>
                <div id="roomProp">
                    <div id="circle3">
                        <img id="friend_image" src="../img/room.png"></img>
                    </div>
                    <div id="room_name">{room}</div>
                </div>
            </a>
            );
        })

        return (
            <div id='in'>
            <div className='ChatList'>
            <div id='AddRoom'>
                <label id='Addtext'>建立房間？請輸入想要的房號</label>
                <div id='AddInput'>
                    <input className="Addinputsyle" type="text" ref='roomnum' id="input-10" onKeyPress={this.handleTest.bind(this)}/>
                </div>
                <div id='AddGo'>
                  <img id='Addgo' src='../img/index_go1.png' onClick={this.handleOnClick.bind(this)}></img> 
                </div>
            </div>
            <div id='chatlist_text'>現有房間清單</div>
            <div id='chatlist_online'>
                {room}
            </div>
          </div>
        </div>
        );
    }
}

export default ChatList;
