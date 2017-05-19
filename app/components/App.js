import React from 'react';
import { BrowserRouter as Router, Route, browserHistory } from 'react-router-dom';
import Header from './Header';
import Menu from './Menu';
import Main from './Main';
import Meeting from './Meeting';
import Chatroom from './Chatroom';
import History from './History';
import Index from './Index';

import socketIO from 'socket.io-client';


let configuration = {
    'iceServers': [{
        'url': 'stun:stun.l.google.com:19302'
    }, {
        'url': 'stun:stun.services.mozilla.com'
    }]
}

class App extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {

    }
    render() {
        return (
            <Router history={browserHistory}>
                <div>
                    <Route exact={true} path="/" component={Index}/>
                    <Route exact={true} path="/main" component={Main}/>
                    <Route exact={true} path='/chatroom' component={Chatroom} />
                    <Route exact={true} path='/meeting'  component={Meeting} />
                    <Route exact={true} path='/history' component={History} />
                </div>
            </Router>
        );
    }
}
export default App;
