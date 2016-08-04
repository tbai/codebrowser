/**
 *
 */
 
var mongoose = require('mongoose')
   ,Schema = mongoose.Schema
   ,ObjectId = Schema.ObjectId;

 
var userStatus = [
    'created' // created but not activated
    ,'active' // active
    ,'blocked' // user was blocked by the system
];
var userSchema = new Schema({
     email: {type:String, lowercase:true, index:{unique:true}}
    ,status:{type:String,enum:userStatus, default:"created"}
});

userSchema.pre("validate",function(next, done) {
    var self = this;
    mongoose.models["User"].findOne({email : self.email},function(err, user) {
        if(err) {
            done(err);
        } else if(user) {
            self.invalidate("email","email must be unique");
            done(new Error("email must be unique"));
        } else {
            done();
        }
    });
    next();
});
 
module.exports = mongoose.model('User', userSchema);
