import React from 'react';
import FriendListStore from '../stores/FriendListStore';
import FriendListActions from '../actions/FriendListActions';
import socket from '../socket';
import MainStore from '../stores/MainStore';
import MeetingStore from '../stores/MeetingStore';

class FriendList extends React.Component {
    constructor(props) {
        super(props);
        this.state = FriendListStore.getState();
        this.onChange = this.onChange.bind(this);
    }
    componentDidMount() {
        FriendListStore.listen(this.onChange);

        socket.on('newRoom', (newList) => {
            FriendListActions.setRoomList(newList);
        })

        socket.on('userList', (userList) => {
            FriendListActions.setUserList(userList);
        })
    }

    componentWillUnmount() {
        FriendListStore.unlisten(this.onChange);
    }

    onChange(state) {
        this.setState(state);
    }

    render() {
        //好友名單上限資料

        //if(!this.state.userList){
            let user = this.state.userList.map((user1) => {
                return (
                    <a href="#">
                        <div id="friend_person">
                            <div id="circle1">
                                <img id="friend_image" src="../img/logo_user.png"></img>
                            </div>
                            <div id="friend_name">{user1}</div>
                        </div>
                    </a>
                );
            });
        //}
        return (
            <div id="friendlist">
                <div id='friend_text'>正在線上：</div>
                {user}
            </div>
        );
    }
}

export default FriendList;
