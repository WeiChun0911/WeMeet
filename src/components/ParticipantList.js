import React from "react";
// import FriendListStore from '../stores/FriendListStore';
// import FriendListActions from '../actions/FriendListActions';
import socket from "../socket";
// import MainStore from '../stores/MainStore';
// import MeetingStore from '../stores/MeetingStore';
import { connect } from "react-redux";
import {
    addParticipantList,
    delParticipantList,
    setParticipantList
} from "../actions/Actions";

class ParticipantList extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        // socket.on("setParticipantList", participantList => {
        //     this.props.dispatch(setParticipantList(participantList));
        // });
        // socket.on("addParticipantList", participantID => {
        //     this.props.dispatch(addParticipantList(participantID));
        // });
        // socket.on("delParticipantList", participantID => {
        //     this.props.dispatch(delParticipantList(participantID));
        // });
    }
    componentWillUnmount() {
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
