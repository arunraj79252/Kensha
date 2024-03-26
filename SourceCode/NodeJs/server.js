
const express = require('express');
const dotenv = require('dotenv');
const logger = require('./utils/logger.utils')
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4500;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
    logger.info(`Server started and running on port ${PORT}`)
})

module.exports = app;