const { body } = require('express-validator')
const errorCode = require('../utils/error-code.utils')
const authValidator = (validationtype) => {
    switch (validationtype) {
        case 'login': {
            return [
                body('publicAddress').exists()
                    .isString()
                    .isLength({ min: 42, max: 42 })
                    .withMessage({ error: 'Invalid Public Address', error_Code: errorCode.Invalid_public_address })
            ]
        }

        case 'sign': {
            return [
                body('signature').exists()
                    .isString()
                    .withMessage({ error: 'Invalid Signature', error_Code: errorCode.Invalid_signature }),
                body('publicAddress').exists()
                    .isString()
                    .isLength({ min: 42, max: 42 })
                    .withMessage({ error: 'Invalid Public Address', error_Code: errorCode.Invalid_public_address })
            ]
        }

        case 'refreshToken': {
            return [
                body('refreshToken').exists()
                    .isString()
                    .withMessage({ error: 'Invalid Refresh Token', error_Code: errorCode.Invalid_refresh_token })
            ]
        }
    }
}

module.exports = { authValidator };
