import alt from '../alt';

class HeaderActions {
    constructor() {
        this.generateActions(
            'getSystemTimeSuccess',
            'getSystemTimeFail',
            'getOrderTimeSuccess',
            'getOrderTimeFail'
        );
    }

  getSystemTime() {
      let d = new Date();
      d = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
      this.actions.getSystemTimeSuccess(d);
  }

    //等預約會議功能完成後，從資料庫取得最靠近的一筆預約會議
    // getOrderTime() {
    //     try {

    //     } catch () {

    //     }
    //     //需要取得預約會議時間
    //     this.actions.getOrderTimeSuccess(data);
    //     this.actions.getOrderTimeFai(data);
    // }

}

export default alt.createActions(HeaderActions);
