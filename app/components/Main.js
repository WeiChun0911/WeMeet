import React from 'react';
import MainStore from '../stores/MainStore';
import MainActions from '../actions/MainActions';
import FriendList from './FriendList';
import IndexLogo from './IndexLogo';

class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = MainStore.getState();
        this.onChange = this.onChange.bind(this);
    }

    componentDidMount() {
        MainStore.listen(this.onChange);
    }

    componentWillUnmount() {
        MainStore.unlisten(this.onChange);
    }

    onChange(state) {
        this.setState(state);
    }

    handleRoomName(e) {
        e.preventDefault();
        let roomName =  this.refs.create_input.value;
        MainActions.saveName(roomName);
        window.location = 'https://140.123.175.95:8787/meeting#' + this.refs.create_input.value;
    }

    handleJoin(e) {
        e.preventDefault();
        window.location = 'https://140.123.175.95:8787/meeting#' + this.refs.create_input.value;
    }

    render() {
        return (
            <div>
                <IndexLogo />  
                <FriendList />
            <div className="box-b">
                <div id="in">
                    <div id="add_meet">
                        <img src='/img/addmeet1.png'></img>
                        <div id="add">建立會議？</div>
                        <div id="add_text">將朋友寫入在以下欄位，即可立即開始會議</div>
                        <span className="input input--minoru">
                            <input className="input__field input__field--yoko" type="text" id="input-16" ref='create_input'/>
                            <label className="input__label input__label--yoko" htmlFor="input-16">
                                <span className="input__label-content input__label-content--yoko">輸入朋友名稱</span>
                            </label>
                        </span>
                        <input type="submit" className="myButton" name="login" id="login" value="GO!" onClick={this.handleRoomName.bind(this)}/>
                    </div>

                    <div id="join_meet">
                        <img src='/img/joinmeet1.png'></img>
                        <div id="add">加入會議？</div>
                        <div id="add_text">將朋友給您的代碼貼上再以下欄位</div>
                        <span className="input input--minoru">
                            <input className="input__field input__field--yoko" type="text" id="input-16" ref='join_input'/>
                            <label className="input__label input__label--yoko" htmlFor="input-16">
                                <span className="input__label-content input__label-content--yoko">會議代碼</span>
                            </label>
                        </span>
                        <input type="submit" className="myButton" name="login" id="login" value="GO!" onClick={this.handleJoin.bind(this)}/>
                    </div>
                </div>
          </div>
          </div>
        );
    }
}

export default Main;
