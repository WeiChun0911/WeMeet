var mongoose = require('mongoose');
var grid = require('gridfs-stream');
var fs = require('fs');
mongoose.Promise = global.Promise;
var conn = mongoose.connect('mongodb://admin:admin@140.123.175.95:9487/admin');

function storeVideoToDB() {
    console.log('db is on!');
    var gfs = grid(conn.db, mongoose.mongo);

    // streaming to gridfs
    //filename to store in mongodb
    var writestream = gfs.createWriteStream({
        filename: 'mongo_file.txt'
    });
    fs.createReadStream('/home/etech/sourcefile.txt').pipe(writestream);

    writestream.on('close', function(file) {
        // do something with `file`
        console.log(file.filename + 'Has written To DB');
    });
}

// All Schema type :
// required: boolean or function, if true adds a required validator for this property
// default: Any or function, sets a default value for the path. If the value is a function, the return value of the function is used as the default.
// select: boolean, specifies default projections for queries
// validate: function, adds a validator function for this property
// get: function, defines a custom getter for this property using Object.defineProperty().
// set: function, defines a custom setter for this property using

var accountSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    birthday: Number,
    email: String,
    registerTime: { type: Number, required: true }
});

var onlineListSchema = new mongoose.Schema({
    onlineTime: { type: Number, required: true }
});

var meetingListSchema = new mongoose.Schema({
    hostUID: { type: String, required: true, unique: true },
    memberUID: { type: String, required: true, unique: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    meetingRecord: { type: String, required: true, unique: true }
});
var sourceListSchema = new mongoose.Schema({

});

//model用來定義操作資料的函數(create/remove/update/find/save...)
var account = mongoose.model('account', accountSchema);
