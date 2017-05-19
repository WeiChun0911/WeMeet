import alt from '../alt';

class UserStateActions {
    constructor() {
        this.generateActions(
            'getUserImgSuccess',
            'getUserImgFail',
            'getUserNameSuccess',
            'getUserNameFail',
            'getOnlineSuccess',
            'getOnlineFail'
        );
    }
/*
    getUserName() {
        fetch('https://140.123.175.95:8787/api/db/userName')
            .then((res) => {
                if (res.ok) {
                    return res.json();
                }
                this.actions.getUserNameFail(res);
            })
            .then((json) => {
                this.actions.getUserNameSuccess(json);
            })
            .catch(
            function (error) {
                //alert(error);
            })
    }
*/
    getUserImg() {
        // fetch('https://140.123.175.95:8787/api/db/test')
        //     .then((res) => {
        //         if (res.ok) {
        //             return res.blob();
        //         }
        //         this.actions.getUserImgFail(res);
        //     })
        //     .then(blob => {
        //         var objectURL = URL.createObjectURL(blob)
        //         this.actions.getUserImgSuccess(objectURL);
        //     })
        //     .catch(
        //     function (error) {
        //         //alert(error);
        //     })
    }
/*
    getOnline() {
        fetch('https://140.123.175.95:8787/api/db/userStatus')
            .then((res) => {
                if (res.ok) {
                    return res.json();
                }
                this.actions.getOnlineFail(res);
            })
            .then((json) => {
                console.log(json.status);
                this.actions.getOnlineSuccess(json);
            })
            .catch(
            function (error) {
                //alert(error);
            })
    }
*/
}

export default alt.createActions(UserStateActions);
