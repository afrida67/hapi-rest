const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stuSchema = new Schema({
    username: String,
    name: String,
    email: String,
    password: String
});

module.exports = mongoose.model('Student', stuSchema);