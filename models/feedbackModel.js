/**
 *
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;


var feedbackSchema = new Schema({
  email: { type: String }
  , text: String
  , datesCreated: { type: Date, default: Date.now() }
});


module.exports = mongoose.model('Feedback', feedbackSchema);
