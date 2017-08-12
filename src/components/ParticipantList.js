import React from "react";
// import FriendListStore from '../stores/FriendListStore';
// import FriendListActions from '../actions/FriendListActions';
import socket from "../socket";
// import MainStore from '../stores/MainStore';
// import MeetingStore from '../stores/MeetingStore';
import { connect } from "react-redux";
import {
    addParticipant,
    delParticipant,
    setParticipantList
} from "../actions/Actions";

class ParticipantList extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        socket.on("setParticipantList", participantList => {
            console.log(123)
            this.props.dispatch(setParticipantList(participantList));
        });
        socket.on("addParticipant", participantID => {
            console.log(456)
            this.props.dispatch(addParticipant(participantID));
        });
        socket.on("delParticipant", participantID => {
            console.log(789)
            this.props.dispatch(delParticipant(participantID));
        });
    }
    render() {
        //好友名單上線資料
        let user = this.props.participantList.map(name => {
            return (
                <a>
                    <div id="friend_person">
                        <div id="circle1">
                            <img id="friend_image" src="../img/logo_user.png" />
                        </div>
                        <div id="friend_name">{name}</div>
                    </div>
                </a>
            );
        });
        return (
            <div id="friendlist">
                <div id="friend_text">正在線上：</div>
                {user}
            </div>
        );
    }
}

const mapStateToProps = state => {
    return {
        participantList: state.participantList
    };
};

export default connect(mapStateToProps)(ParticipantList);
