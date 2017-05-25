var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
//var grid = require('gridfs-stream');
var fs = require('fs');
mongoose.Promise = global.Promise;
var conn = mongoose.createConnection('mongodb://admin:admin@140.123.175.95:9487/main');

// function storeFileToDB() {
//     console.log('db is on!');
//     var gfs = grid(conn, mongoose.mongo);

//     // streaming to gridfs
//     //filename to store in mongodb
//     var writestream = gfs.createWriteStream({
//         filename: 'je.jpg'
//     });
//     fs.createReadStream('W:/WeMeet/public/src/je.jpg').pipe(writestream);

//     writestream.on('close', function(file) {
//         // do something with 'file'
//         console.log(file + 'Has written To DB');
//     });
// }

//storeFileToDB();

// All Schema type :
// required: boolean or function, if true adds a required validator for this property
// default: Any or function, sets a default value for the path. If the value is a function, the return value of the function is used as the default.
// select: boolean, specifies default projections for queries
// validate: function, adds a validator function for this property
// get: function, defines a custom getter for this property using Object.defineProperty().
// set: function, defines a custom setter for this property using



let historySchema = new mongoose.Schema({
    room: String,
    history: mongoose.Schema.Types.Mixed
});

exports.History = conn.model('History', historySchema);

// let onlineListSchema = new mongoose.Schema({
//     onlineTime: { type: Number, required: true }
// });
// exports.OnlineList = conn.model('OnlineList', onlineListSchema);


// let meetingListSchema = new mongoose.Schema({
//     hostUID: { type: String, required: true, unique: true },
//     memberUID: { type: String, required: true, unique: true },
//     startTime: { type: Number, required: true },
//     endTime: { type: Number, required: true },
//     meetingRecord: { type: String, required: true, unique: true }
// });
// meetingListSchema.plugin(uniqueValidator);
// exports.MeetingList = conn.model('MeetingList', meetingListSchema);


// let sourceListSchema = new mongoose.Schema({
//     fileName: { type: String, required: true },
//     fileType: { type: String, required: true },
//     fileBuffer: { type: Buffer, required: true },
//     uploadTime: { type: String, required: true, }
// });
// exports.SourceList = conn.model('SourceList', sourceListSchema);


//model用來定義操作資料的函數(create/remove/update/find/save...)
// var account = mongoose.model('account', accountSchema);
