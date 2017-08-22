import React from "react";
import RoomList from "./RoomList";
import socket from "../socket";

// socket.emit("id");
class Index extends React.Component {
    constructor(props) {
        super(props);
        this.localUserID = "";
    }

    componentDidMount() {
        socket.on("success", msg => {
            this.localUserID = msg;
        });
    }

    handleEnter(e) {
        if (e.charCode == 13 && !this.refs.userName.value) {
            event.preventDefault();
            let r = confirm("你沒有輸入名字喔，我們將會給你一組亂碼好嗎?");
            if (r == true) {
                this.refs.userName.value = "Hi! " + this.localUserID;
            }
            //socket.emit('setFakeName', this.refs.Username.value);
            //this.roomName = this.refs.roomnum.value;
        } else if (e.charCode == 13 && this.refs.userName.value) {
            event.preventDefault();
            if (this.refs.userName.value.search("Hi!") == -1) {
                this.refs.userName.value = "Hi! " + this.refs.userName.value;
            } else {
                return false;
            }
        }
    }

    render() {
        return (
            <div className="container">
                <div className="Index">
                    <div className="logo">
                        <div id="in">
                            <img id="Indexlogo" src="../img/index_logo.png" />
                        </div>
                    </div>
                    <div className="inputName">
                        <span className="input input--isao">
                            <input
                                ref="userName"
                                onKeyPress={(e)=>{this.handleEnter(e)}}
                                className="input__field input__field--isao"
                                type="text"
                                id="input-38"
                            />
                            <label
                                className="input__label input__label--isao"
                                for="input-38"
                                data-content="請輸入你的名字"
                            >
                                <span className="input__label-content input__label-content--isao">
                                    請輸入你的名字
                                </span>
                            </label>
                        </span>
                    </div>
                </div>
                <RoomList />
            </div>
        );
    }
}

export default Index;
