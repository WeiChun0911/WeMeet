import React from 'react';

class IndexLogo extends React.Component {
  constructor(props){
    super(props);
  }
 
  render() {
    return(
        <div id="user_infro">
            <a href='https://140.123.175.95:8787'><img id='index_img' src='/img/index_logo2.png'></img></a>
        </div> 
    );
  }
}

export default IndexLogo;
