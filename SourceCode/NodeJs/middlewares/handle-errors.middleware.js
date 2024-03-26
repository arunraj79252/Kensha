const { GeneralError } = require("../utils/errors");
const logger = require('../utils/logger.utils');

const handleErrors = (err, req, res, next) => {
    if (err instanceof GeneralError) {
        logger.error(`${err.getCode()} - 'error' - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
        return res.status(err.getCode()).json({
            status: 'error',
            message: err.message
        })
    }
   
    logger.error(`${err.status || 500} - 'error' - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    return res.status(500).json({
        status: 'error',
        message: err.message
    })
}

module.exports = handleErrors;