import React from 'react';
import HeaderStore from '../stores/HeaderStore';
import HeaderActions from '../actions/HeaderActions';

class Header extends React.Component {
    constructor(props) {
        super(props);
        this.state = HeaderStore.getState();
        this.onChange = this.onChange.bind(this);
    }

    componentDidMount() {
        HeaderStore.listen(this.onChange);
        HeaderActions.getSystemTime();
        this.timer = setInterval(HeaderActions.getSystemTime,1000);
    }

    componentWillUnmount() {
        clearInterval(this.timer);
        HeaderStore.unlisten(this.onChange);
    }

    onChange(state) {
        this.setState(state);
    }

    render() {
        return (
            <div id="status">
                <div id="time">目前時間:{this.state.systemTime}</div>      
                <div id="order">近期預約的會議：{this.state.orderTime}</div>
                <a href='https://140.123.175.95:8787'><div id="logo"><img src='/img/index_logo2.png'></img></div></a>
            </div>
        );
    }
}

export default Header;
