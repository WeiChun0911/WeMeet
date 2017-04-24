var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/test');


//Mongoose一切由schema開始，
//schema會定義collection裡的documents的輪廓、型態
//會map到mongodb中的collections
var userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: Number,
    email:String
});

//新增一個貓的資料輪廓<喵喵叫函數>
// kittySchema.methods.speak = function() {
//     var greeting = this.name ? "My name is " + this.name : "I don't have a name";
//     console.log(greeting);
// }

//Model是一個用來建構documents的class
//透過這份Kitten model創建的documents裡的資料都會依照schema的樣子
//而model則用來定義操作資料的函數(create/remove/update/find/save...)
var User = mongoose.model('Kitten', userSchema);

module.exports = User;
