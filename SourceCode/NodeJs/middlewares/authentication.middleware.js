const db = require("../models");
const User = db.user;
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger.utils');
const { Unauthorized } = require('../utils/errors.js');

const authenticate = async (req, res, next) => {
    const access_token = req.header('Authorization');
    if (!access_token || !access_token.startsWith('PATENT')) {
        next(new Unauthorized({error:"Invalid Token!", error_Code:801}));
    }
    else {
        try {
            const token = await checkTokenValidity(access_token.replace('PATENT ', ''));

            const user = await User.findOne({ _id: token.data }).select(['-__v']).select(['-updatedAt']).select(['-createdAt']);
            ;
            req.user = user;

            if (token.data) {
                next();
            }
            else {
                next(new Unauthorized({error:"Invalid Token!", error_Code:801}));

            }

        } catch (error) {
            logger.error(`${error.status} - 'error' - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
            next(new Unauthorized({error:"Invalid Token!", error_Code:801}));

        }
    }
}
function checkTokenValidity(token) {

    const data = jwt.verify(token, 'Inn0v@tur3', function (err, decoded) {

        return decoded ? decoded : err

    });
    return data

}

module.exports = authenticate;
