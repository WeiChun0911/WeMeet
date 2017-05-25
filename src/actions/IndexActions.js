import alt from '../alt';

class IndexActions {
  constructor(){
    this.generateActions(
      'changeGostate',
      'sendvalue'
    );
  }

}

export default alt.createActions(IndexAction);