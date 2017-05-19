import React from 'react';
import ChatList from './ChatList';
import socket from '../socket';

//socket.emit('id');
class Index extends React.Component {
    constructor(props) {
        super(props);
        this.localUserID = '';
    }
    componentDidMount() {
        socket.on('success', (msg) => {
            this.localUserID = msg;
        });
    }

    //按下enter後的事件處理 
    handleTest(e) {
        if (e.charCode == 13) {
            event.preventDefault();
            if (!this.refs.Username.value) {
                var r = confirm("你沒有輸入名字喔，我們將會給你一組亂碼好嗎?");
                if (r == true) {
                    this.refs.Username.value = "Hi! " + this.localUserID;
                }
            }
            this.refs.Username.value = "Hi! " + this.refs.Username.value;
            //socket.emit('setFakeName', this.refs.Username.value);
            //this.roomName = this.refs.roomnum.value;
        }
    }

    render() {
        return (
            <div className="container" >
        <div className='Index'>
          <div className="logo">
            <div id="in"><img id='Indexlogo' src="../img/index_logo.png"/></div>
          </div>
          <div className='inputName'>
            <span className="input input--isao">
              <input ref='UserName' ref='Username' onKeyPress={this.handleTest.bind(this)} className="input__field input__field--isao" type="text" id="input-38" />
              <label className="input__label input__label--isao" for="input-38" data-content="請輸入你的名字">
                <span className="input__label-content input__label-content--isao" ref="UserName">請輸入你的名字</span>
              </label>
            </span>
          </div>
          
        </div>

        <ChatList />

      </div>
        );
    }
}

export default Index;
