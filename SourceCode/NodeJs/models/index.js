const mongoose = require("mongoose");
const dotenv = require('dotenv')
dotenv.config();
const { dbName, host } = process.env;
mongoose.Promise = global.Promise;
const db = {};
db.mongoose = mongoose;
db.url = `mongodb://${host}:27017/${dbName}`;
db.user = require("./user.model.js")(mongoose);
db.patent = require("./patent.model.js")(mongoose);
db.signature=require("./signature.model.js")(mongoose);
db.notification=require("./notification.model.js")(mongoose);
module.exports = db;