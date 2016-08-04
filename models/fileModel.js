/**
 *
 */
 
var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;


var fileSchema = new Schema({    
    fullpath: String
    , basename: String
    , extension: String
    , text: String
    , history: String
    , _repository: { type: Schema.Types.ObjectId, ref: 'Repository' }
    , datesCreated: {type:Date, default:Date.now()}
    , lastUpdated: {type:Date, default:Date.now()}
});

/*fileSchema.index( { "basename": 1, "fullpath":1 } );*/

fileSchema.pre("validate",function(next, done) {
    var self = this;
    mongoose.models["File"].findOne({fullpath : self.fullpath},function(err, file) {
        if(err) {
            done(err);
        } else if(file) {
            self.invalidate("fullpath","fullpath must be unique");
            done(new Error("fullpath must be unique"));
        } else {
            done();
        }
    });
    next();
});
 
module.exports = mongoose.model('File', fileSchema);