const { body } = require('express-validator')
const { Min_length_address } = require('../utils/error-code.utils')
const errorCode = require('../utils/error-code.utils')
const userValidator = (validationtype) => {
    switch (validationtype) {
        case 'registration': {
            return [
                body('publicAddress', 'Invalid Public Address').exists()
                    .isString()
                    .isEthereumAddress()
                    .isLength({ min: 42, max: 42 })
                    .withMessage({ error: 'Invalid Public Address', error_Code: errorCode.Invalid_public_address }),

                body('name').exists()
                    .withMessage({ error: 'Name required', error_Code: errorCode.Name_is_required })
                    .isString()
                    .isLength({ min: 1 })
                    .withMessage({ error: 'Must contain atleast 1 character', error_Code: errorCode.Min_length_string })
                    .isLength({ max: 100 })
                    .withMessage({ error: 'Must not exceed 100 characters', error_Code: errorCode.Max_length_string })
                    .matches("^(?![\. ])[a-zA-Z\. ]+(?<![\. ])$")
                    .withMessage({ error: 'Invalid Name', error_Code: errorCode.Invalid_name }),

                body('phoneNo', 'Invalid Phone Number').optional({ nullable: true, checkFalsy: true })
                    .isNumeric()
                    .withMessage({ error: 'Invalid Phone Number', error_Code: errorCode.Invalid_phone_number })
                    .isLength({ min: 10 })
                    .withMessage({ error: 'There has to be at least 10 numerical.', error_Code: errorCode.Min_length_phone })
                    .isLength({ max: 20 })
                    .withMessage({ error: 'Maximum 20 number', error_Code: errorCode.Max_length_phone }),

                body('email', 'Invalid Email Address').exists({ nullable: true, checkFalsy: true })
                    .isEmail()
                    .withMessage({ error: 'Invalid Email Address', error_Code: errorCode.Invalid_email_address }),

                body('address', 'Invalid Address').optional({ nullable: true, checkFalsy: true })
                    .isString()
                    .withMessage({ error: 'Invalid  Address', error_Code: errorCode.Invalid_address })
                    .isLength({ min: 1 })
                    .withMessage({ error: 'Must contain atleast 1 character', error_Code: errorCode.Min_length_address })
                    .isLength({ max: 200 })
                    .withMessage({ error: 'Must not exceed 200 characters', error_Code: errorCode.Max_length_address }),

                body('district', 'Invalid district name').optional({ nullable: true, checkFalsy: true })
                    .isString()
                    .withMessage({ error: 'Invalid district name', error_Code: errorCode.Invalid_district })
                    .isLength({ min: 1 })
                    .withMessage({ error: 'Must contain atleast 1 character', error_Code: errorCode.Min_length_district })
                    .isLength({ max: 20 })
                    .withMessage({ error: 'Must not exceed 20 characters', error_Code: errorCode.Max_length_district }),


                body('pincode', 'Invalid pincode').optional({ nullable: true, checkFalsy: true })
                    .isNumeric()
                    .withMessage({ error: 'Invalid Pincode', error_Code: errorCode.Invalid_pincode })
                    .isLength({ min: 5 })
                    .withMessage({ error: 'Minimum 5 numbers required for pincode', error_Code: errorCode.Min_length_pin })
                    .isLength({ max: 20 })
                    .withMessage({ error: 'Maximum 20 numbers', error_Code: errorCode.Max_length_pin }),
            ]
        }

        case 'updateUser': {
            return [
                body('publicAddress', 'Invalid Public Address').optional({ nullable: true, checkFalsy: true })
                    .isString()
                    .isLength({ min: 42, max: 42 })
                    .withMessage({ error: 'Invalid Public Address', error_Code: errorCode.Invalid_public_address }),

                body('name').exists()
                    .withMessage({ error: ' Name required', error_Code: errorCode.Name_is_required })
                    .isString()
                    .isLength({ min: 1 })
                    .withMessage({ error: 'Must contain atleast 1 character', error_Code: errorCode.Min_length_string })
                    .isLength({ max: 100 })
                    .withMessage({ error: 'Must not exceed 100 characters', error_Code: errorCode.Max_length_string })
                    .matches("^(?![\. ])[a-zA-Z\. ]+(?<![\. ])$")
                    .withMessage({ error: 'Invalid Name', error_Code: errorCode.Invalid_name }),

                body('phoneNo', 'Invalid Phone Number').optional({ nullable: true, checkFalsy: true })
                    .isNumeric()
                    .withMessage({ error: 'Invalid Phone Number', error_Code: errorCode.Invalid_phone_number })
                    .isLength({ min: 10 })
                    .withMessage({ error: 'There has to be at least 10 numerical.', error_Code: errorCode.Min_length_phone })
                    .isLength({ max: 20 })
                    .withMessage({ error: 'Maximum 20 number', error_Code: errorCode.Max_length_phone }),

                body('email', 'Invalid Email Address').optional({ nullable: true, checkFalsy: true })
                    .isEmail()
                    .withMessage({ error: 'Invalid Email Address', error_Code: errorCode.Invalid_email_address }),

                body('address', 'Invalid Address').optional({ nullable: true, checkFalsy: true })
                    .isString()
                    .withMessage({ error: 'Invalid  Address', error_Code: errorCode.Invalid_address })
                    .isLength({ min: 1 })
                    .withMessage({ error: 'Must contain atleast 1 character', error_Code: errorCode.Min_length_address })
                    .isLength({ max: 200 })
                    .withMessage({ error: 'Must not exceed 200 characters', error_Code: errorCode.Max_length_address }),

                body('district', 'Invalid district name').optional({ nullable: true, checkFalsy: true })
                    .isString()
                    .withMessage({ error: 'Invalid district name', error_Code: errorCode.Invalid_district })
                    .isLength({ min: 1 })
                    .withMessage({ error: 'Must contain atleast 1 character', error_Code: errorCode.Min_length_district })
                    .isLength({ max: 20 })
                    .withMessage({ error: 'Must not exceed 20 characters', error_Code: errorCode.Max_length_district }),

                body('pincode', 'Invalid pincode').optional({ nullable: true, checkFalsy: true })
                    .isNumeric()
                    .withMessage({ error: 'Invalid Pincode', error_Code: errorCode.Invalid_pincode })
                    .isLength({ min: 5 })
                    .withMessage({ error: ' Minimum 5 numbers required for pincode', error_Code: errorCode.Min_length_pin })
                    .isLength({ max: 20 })
                    .withMessage({ error: ' Maximum 20 numbers', error_Code: errorCode.Max_length_pin }),
            ]
        }

        case 'comment': {
            return [
                body('message').exists()
                    .withMessage({ error: ' Field cannot be empty', error_Code: errorCode.Comment_is_empty })
                    .isString()
                    .withMessage({ error: ' Invalid message', error_Code: errorCode.Invalid_comment })
                    .isLength({ min: 1, max: 1000 })
                    .withMessage({ error: 'message length should be between  1 to 1000 chracters ', error_Code: errorCode.Invalid_comment_length })
            ]
        }

        case 'createPatent': {
            return [
                body('patentName').exists()
                    .isString()
                    .isLength({ min: 2 })
                    .withMessage({ error: 'Must be atleast 2 chars long', error_Code: errorCode.Min_length_patent_name })
                    .isLength({ max: 100 })
                    .withMessage({ error: 'Must not exceed 100 characters', error_Code: errorCode.Max_length_patent_name })
                    .matches("^(?![\.\, ])[a-zA-Z0-9\.\, ]+(?<![\. ])$")
                    .withMessage({ error: 'Invalid patent name', errorcode: errorCode.Invalid_patent_name }),

                body('description', 'Invalid Description').exists()
                    .isString()
                    .withMessage({ error: 'Invalid Description', errorcode: errorCode.Invalid_patent_description })
                    .isLength({ min: 1 })
                    .withMessage({ error: 'Must contain atleast 1 character', error_Code: errorCode.Min_length_patent_description })
                    .isLength({ max: 800 })
                    .withMessage({ error: 'Must not exceed 800 characters', error_Code: errorCode.Max_length_patent_description }),

                body('uploadfile', 'Invalid file name').exists()
                    .isArray({ min: 1, max: 3 })
            ]
        }

        case 'updatePatent': {
            return [
                body('patentName').optional({ nullable: true, checkFalsy: true })
                    .isString()
                    .isLength({ min: 2 })
                    .withMessage({ error: 'Must be atleast 2 chars long', error_Code: errorCode.Min_length_patent_name })
                    .isLength({ max: 100 })
                    .withMessage({ error: 'Must not exceed 100 characters', error_Code: errorCode.Max_length_patent_name })
                    .matches("^(?![\. ])[a-zA-Z0-9\. ]+(?<![\. ])$")
                    .withMessage({ error: 'Invalid Patent Name', error_Code: errorCode.Invalid_patent_name }),

                body('description', 'Invalid Description').optional({ nullable: true, checkFalsy: true })
                    .isString()
                    .withMessage({ error: 'Invalid Description', error_Code: errorCode.Invalid_patent_description })
                    .isLength({ min: 1 })
                    .withMessage({ error: 'Must contain atleast 1 character', error_Code: errorCode.Min_length_patent_description })
                    .isLength({ max: 800 })
                    .withMessage({ error: 'Must not exceed 800 characters', error_Code: errorCode.Max_length_patent_description }),

                body('s3Address', 'Invalid File address').optional({ nullable: true, checkFalsy: true })
                    .isArray({ min: 1, max: 3 })
            ]
        }

        case 'transactionHash': {
            return [
                body('transactionHash')
                    .exists()
                    .withMessage({ error: 'Transaction hash cannot be empty', error_Code: errorCode.TransactionHash_is_empty })
                    .isString()
                    .isByteLength(32)
                    .withMessage({ error: 'Invalid txHash', error_Code: errorCode.Invalid_transactionHash })
            ]

        }

        case 'readyForSale': {
            return [
                body('baseAmount')
                    .exists()
                    .withMessage({ error: "Please enter base amount", error_Code: errorCode.No_base_amount_entered })
                    .isFloat()
                    .withMessage({ error: "Invalid Base Amount", error_Code: errorCode.Amount_not_number })
            ]
        }

        case 'createBid': {
            return [
                body('bidAmount')
                    .exists()
                    .withMessage({ error: "Please enter bid amount", error_Code: errorCode.No_amount_entered })
                    .isFloat()
                    .withMessage({ error: "Invalid bid Amount", error_Code: errorCode.Amount_not_number })
            ]
        }

        case 'approveBuyer': {
            return [
                body('buyer')
                    .exists()
                    .withMessage({ error: "Please enter buyer address ", error_Code: errorCode.No_buyer_address_entered })
                    .isEthereumAddress()
                    .withMessage({ error: "Please enter valid buyer address", error_Code: errorCode.Invalid_buyer_address }),

                body('price')
                    .exists()
                    .withMessage({ error: "Please enter price amount", error_Code: errorCode.No_amount_entered })
                    .isFloat()
                    .withMessage({ error: "Invalid price Amount", error_Code: errorCode.Amount_not_number })
            ]
        }
    }
}

module.exports = { userValidator };