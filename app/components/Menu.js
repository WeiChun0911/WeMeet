import React from 'react';
import {Link} from 'react-router';

class Menu extends React.Component {

  render() {
    return(
    <div id="menu">　　
      <a href='/'><img id="menu_icon" src="../img/home.png" alt="首頁"  title="首頁"/>　　　</a>
     <a href='history'><img id="menu_icon" src="../img/history.png"alt="開會歷史" title="開會歷史"/>　　　</a>
    </div>
    );
  }
}

export default Menu;
