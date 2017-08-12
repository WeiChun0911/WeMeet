import React from "react";

class IndexLogo extends React.Component {
    constructor(props) {
        super(props);
        this.indexURL = "http://localhost:8787"
    }

    render() {
        return (
            <div id="user_infro">
                <a href={this.indexURL}>
                    <img id="index_img" src="/img/index_logo2.png" />
                </a>
            </div>
        );
    }
}

export default IndexLogo;
