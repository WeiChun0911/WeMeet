import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import { createStore } from 'redux';

const reducer = () => {
}

const store = createStore(reducer);

ReactDOM.render(<App store={ store } />, document.getElementById('app'));
