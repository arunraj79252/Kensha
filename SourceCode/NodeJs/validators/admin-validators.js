const { body } = require('express-validator')
const errorCode = require('../utils/error-code.utils')
const adminValidator = (validationtype) => {
    switch (validationtype) {
        case 'messageValidate': {
            return [
                body('message').optional({ nullable: true, checkFalsy: true })
                    .isString()
                    .withMessage({ error: 'Invalid message', error_Code: errorCode.Invalid_comment })
                    .isLength({ min: 1, max: 1000 })
                    .withMessage({ error: 'message length should be between  1 to 1000 chracters ', error_Code: errorCode.Invalid_comment_length })
            ]
        }
        
        case 'comment': {
            return [
                body('message').exists()
                    .withMessage({ error: 'Field cannot be empty', error_Code: errorCode.Comment_is_empty })
                    .isString()
                    .withMessage({ error: 'Invalid message', error_Code: errorCode.Invalid_comment })
                    .isLength({ min: 1, max: 1000 })
                    .withMessage({ error: 'message length should be between  1 to 1000 chracters ', error_Code: errorCode.Invalid_comment_length })
            ]
        }
    }
}

module.exports = { adminValidator };