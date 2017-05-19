import alt from '../alt';
import IndexActions from '../actions/IndexActions';

class IndexStore {
  constrcutor(){
    this.bindActions(IndexActions);
    //還未完成
  }

    changeGostate{}

}

export default alt.createStore(IndexStore);