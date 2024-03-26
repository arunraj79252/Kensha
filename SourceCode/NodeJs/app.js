const express = require("express");
const cors = require("cors");
const handleErrors = require('./middlewares/handle-errors.middleware');
const db = require("./models");
const app = require("./server")
const { NotFound } = require('./utils/errors')
let corsOptions = {};
app.use(cors(corsOptions));
const bodyParser = require('body-parser')
// connect to mongodb
dbConnect()
function dbConnect() {
  db.mongoose
    .connect(db.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => {
      console.log("Connected to the database!");
    })
    .catch(err => {
      console.log("Cannot connect to the database! Retrying...");
      dbConnect()
    });
}

app.use(bodyParser.json({
  limit: '50mb'
}));

app.use(bodyParser.urlencoded({
  limit: '50mb',
  parameterLimit: 100000,
  extended: true
}));

// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
// simple route
app.get("/", (req, res) => {
  res.json({ message: "kensha." });
});
require("./routes/user.routes")(app);
require("./routes/admin.routes")(app);
require("./routes/auth.routes")(app);
require("./routes/public.routes")(app);
require("./batch/updateBlockchainTransaction")(app);
app.get('*', function (req, res, next) {
  next(new NotFound({ error: "API not found", error_Code: 404 }));
});
app.use(handleErrors);

