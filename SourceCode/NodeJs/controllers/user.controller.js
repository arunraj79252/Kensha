const db = require("../models");
require('dotenv').config();
const { getTokenURI, getTransactionStatus, setTokenBuyer } = require("../utils/blockchain-utils")
const User = db.user;
const Patent = db.patent;
const Web3 = require('web3');
const jwt = require('jsonwebtoken');
const constants = require('../config/constants.config');
const role = require("../utils/user-roles.utils")
const { validationResult } = require('express-validator');
const AWS = require('aws-sdk');
const awsConfig = require('../config/aws.config');
const upload = require('../middlewares/storage.middleware');
const uploadfile = upload.single('uploadfile')
const { Pending, rejected, transactionCompleted, resubmitted, approved, readyForPayment, paymentPending, paymentFailed } = require('../utils/patent-status.utils');
const { BadRequest, GeneralError } = require("../utils/errors");
const { readyForSale, notForSale, biddingComplete, transferPending, transferFailed } = require("../utils/transfer-status.utils");
const transfer = require('../utils/transfer-status.utils');
const Notification = db.notification;
const { bid_amount_less_than_base_amount, Failed_to_initiate_transfer, Patent_not_in_readyForSale_transferStatus, Failed_to_update_user, Patent_not_in_applied_or_resubmitted_or_rejected_status, Patent_Not_Found, Failed_to_update_patent, Patent_not_in_readyForPayment_or_paymentFailed_status, Patent_not_in_paymentPending_status, Patent_not_in_transactionCompleted_status, Error_while_checking_transaction_status, Error_while_fetching_patent_details, Error_while_fetching_patent } = require("../utils/error-code.utils");
const { approvePatent, transferPatent } = require("../utils/patent.utils");
const moment = require('moment');
const admin = require("firebase-admin");

AWS.config.update({
    region: awsConfig.region,
    credentials: {
        accessKeyId: process.env.accessKeyId,
        secretAccessKey: process.env.secretAccessKey,
    },
})
const params = {
    Bucket: awsConfig.bucket,
    MaxKeys: 1000
};
let s3 = new AWS.S3();
exports.profileView = (req, res) => {
    res.send(req.user)
}
exports.profileupdate = (req, res) => {
    const id = req.user.id
    User.findByIdAndUpdate(id, req.body)
        .then(data => {
            res.send({
                message:
                    "success"
            });
        });
}

//Upload Files
exports.uploadfiles = (req, res) => {
    uploadfile(req, res, function (err) {
        if (err) {
            console.error(err)
            return res.status(400).send({ message: err.message })
        } else {
            return res.send({ filepath: req.file.key.replace('temp/', '') });
        }
    })
}
//Delete Files
exports.deletefiles = (req, res) => {
    if (req.params.file) {
        try {
            s3.deleteObject({

                Bucket: awsConfig.bucket,
                Key: 'temp/' + req.params.file
            }).promise()
            return res.status(200).send({ message: "File deleted successfully" })

        }
        catch {
            return res.status(404).send({ message: "File not found" })

        }

    }
}

//Comment
exports.comment = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        next(new BadRequest({ message: errors.errors[0].msg }));

    }
    if (req.body.message) {
        const id = req.params.id
        let body = {
            $push: { "message": [{ message: req.body.message, user: req.user.name, userPublicAddress: req.user.id }] }
        }

        Patent.findByIdAndUpdate(id, body)
            .then(data => {
                res.send({
                    message:
                        "success"
                });
            })
            .catch(() => {
                next(new GeneralError({ error: "Failed to update user", error_Code: Failed_to_update_user }))
            })
    }
}

exports.findone = async (req, res) => {
    await Patent.aggregate([
        { $match: { _id: Number(req.params.id) } },
        {
            $lookup: {
                from: "users",
                localField: "approvedBuyer",
                foreignField: "_id",
                as: "buyer"
            }
        },
        {
            $project: {
                _id: 0,
                id: '$_id',
                patentName: 1,
                publicAddress: 1,
                description: 1,
                s3Address: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
                message: 1,
                transferStatus: 1,
                transferLog: 1,
                bidLog: 1,
                baseAmount: 1,
                approvedBuyer: 1,
                approvedPrice: 1,
                payment_expiry_date: 1,
                buyerName: { $arrayElemAt: ['$buyer.name', 0] },

            }
        }
    ])
        .then(record => {
            if (record != null && record != '') {
                res.send(...record)
            }
            else {
                res.status(400).send({ message: "no patents found" });
            }
        })


}

// To create patent
exports.createPatent = async (req, res) => {
    const errors = validationResult(req);
    let updateFileCount = 0;
    if (!errors.isEmpty()) {
        res.status(400).send({ message: errors.errors[0].msg });
        return;
    }
    const id = Math.floor(Math.random() * 100).toString() + new Date().getTime().toString();
    if (req.body) {
        await s3.listObjects(params, function (err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                for (const element of req.body.uploadfile) {
                    const OLD_KEY = 'temp/' + element
                    const NEW_KEY = element
                    try {
                        s3.copyObject({
                            Bucket: awsConfig.bucket,
                            CopySource: `${awsConfig.bucket}/${OLD_KEY}`,
                            Key: NEW_KEY,
                            ACL: 'public-read',

                        }).promise()
                            .then((response) => {
                                updateFileCount++
                                if (updateFileCount == req.body.uploadfile.length) {
                                    let patent = new Patent({
                                        patentName: req.body.patentName,
                                        publicAddress: req.user.id,
                                        s3Address: req.body.uploadfile,
                                        description: req.body.description,
                                        mintTxHash: "",
                                        statusLog: [{ status: 0, message: "new patent applied" }],
                                        status: 0,
                                        _id: id
                                    })
                                    patent
                                        .save(patent)
                                        .then(data => {
                                            res.send(data);
                                        })
                                        .catch(_err => {
                                            res.status(500).send({
                                                message:
                                                    "Some error occurred while creating the patent."
                                            });
                                        });
                                } s3.deleteObject({

                                    Bucket: awsConfig.bucket,
                                    Key: OLD_KEY
                                }).promise()
                            })
                            .catch((e) => res.status(500).send({
                                message: "No such file found in the server"
                            }))
                    } catch (error) {
                        res.status(500).send({
                            message: error
                        });
                    }
                }//for loop ends
            }
        });
    }

    else {
        res.status(500).send({
            message:
                "Some error occurred while creating the patent."
        });
    }


};

//To create user
exports.createUser = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).send({ message: errors.errors[0].msg });
        return;
    }

    if (!req.body.publicAddress) {
        res.status(400).send({ message: "publicAddress cannot be empty " });
        return;
    }

    //Checking if public address is a valid address or not
    if (!Web3.utils.isAddress(req.body.publicAddress)) {
        res.status(500).send({
            status: 500,
            message: "Address Invalid"
        })
        return
    }

    //Json Object
    let reqBody = {
        _id: req.body.publicAddress,

    }

    //Check whether user already exist or not
    User.findOne(reqBody)
        .then(data => {

            if (data) {
                res.status(500).send({
                    status: 500,
                    message: "User already exists"
                })
            }
            else {
                const user = new User({
                    _id: req.body.publicAddress,
                    name: req.body.name,
                    address: req.body.address,
                    district: req.body.district,
                    pincode: req.body.pincode,
                    phoneNo: req.body.phoneNo,
                    email: req.body.email,
                    usertype: role.Applicant
                });

                user.save(user)
                    .then(() => {
                        res.send({
                            status: 200,
                            message: "Registration completed successfully"
                        })
                    })
                    .catch((err) => {
                        console.error("Registration Failed: " + err)
                        res.status(500).send({
                            status: 500,
                            message: "Registration failed!"
                        })
                    })
            }


        }).catch(err => {
            res.status(404).send({
                status: 409,
                message: `Cannot find a user or user already registered`
            });

        });
};

//To list patents
exports.listPatent = (req, res) => {
    let match = {}
    let sortParam = {}
    let result;
    match.publicAddress = req.user.id;
    if (req.query.status) {
        match.status = req.query.status
    }

    //Keyword search
    if (req.query.keyword) {
        match.$or = [
            { "patentName": { $regex: req.query.keyword, $options: 'i' } },
            { "description": { $regex: req.query.keyword, $options: 'i' } }
        ]

    }

    //Sorting
    if (req.query.updatedAt) {
        sortParam = {
            updatedAt: req.query.updatedAt
        }
    }
    else if (req.query.createdAt) {
        sortParam = {
            createdAt: req.query.createdAt
        }
    }
    else if (req.query.patentName) {
        sortParam = {
            patentName: req.query.patentName
        }
    }
    else if (req.query.description) {
        sortParam = {
            description: req.query.description
        }
    }
    let sortKey = Object.keys(sortParam)[0]
    sortParam[sortKey] = (sortParam[sortKey] == -1) ? -1 : 1
    const page = req.query.token ? generateDataFromToken(req.query.token) : 1;
    getResultCount(match)//find and count and return count
        .then(count => {
            if (!count)
                res.send({
                    data: [],
                    token: ''
                });
            if (count > 0) {
                let skipValue = (page - 1) * constants.pageLimit;
                Patent.find(match, { patentName: 1, description: 1, status: 1, createdAt: 1, transferStatus: 1, index: showIndexNumber(skipValue) },)
                    .sort(sortParam)
                    .limit(constants.pageLimit)
                    .skip(skipValue).then(data => {
                        result = data
                        if (count > page * constants.pageLimit) {

                            result = {
                                data: [...data],
                                token: generateToken(page + 1)
                            }
                        }
                        else {
                            result = {
                                data: [...data],
                                token: ''
                            }
                        }
                        if (page > 1)
                            result = { ...result, previousToken: generateToken(page - 1) }
                        else
                            result = { ...result, previousToken: '' }
                        res.send(result);
                    })
            }


        }).catch((e) => {
            res.status(500).send({
                message: e
            });
        })
}
async function getResultCount(match) {
    return Patent.count(match)
}
function showIndexNumber(value) {
    let firstIndex = value + 1
    let setQuery = {
        "$function": {
            "body": "function(firstIndex) {try {row_number+= 1;} catch (e) {row_number= firstIndex;}return row_number;}",
            "args": [firstIndex],
            "lang": "js"
        }
    }
    return setQuery
}
function generateToken(token) {
    return jwt.sign(
        {
            data: token,
        }, constants.paginationToken
    )

}
function generateDataFromToken(token) {
    const data = jwt.verify(token, constants.paginationToken, function (err, decoded) {

        return decoded ? decoded.data : 1

    });
    return data
}

///To edit patent
exports.editPatents = async (req, res, next) => {
    const id = req.params.id;
    const currentData = await Patent.findOne({ _id: req.params.id }).catch((e) => console.error("ERROR in patent Edit: " + e))
    if (currentData != '') {
        if (currentData.status == Pending || currentData.status == rejected || currentData.status == resubmitted) {
            let updateBody = {}
            let updateCounter = 0;
            let oldFiles = currentData.s3Address
            if (req.body.s3Address) {
                let newFiles = req.body.s3Address
                for (const element of newFiles) {
                    if (!oldFiles.includes(element)) {
                        const OLD_KEY = 'temp/' + element
                        const NEW_KEY = element
                        await s3.copyObject({
                            Bucket: awsConfig.bucket,
                            CopySource: `${awsConfig.bucket}/${OLD_KEY}`,
                            Key: NEW_KEY,
                            ACL: 'public-read',
                        }).promise()
                            .then((response) => {
                                updateCounter++
                                s3.deleteObject({
                                    Bucket: awsConfig.bucket,
                                    Key: OLD_KEY
                                }).promise()
                            })
                            .catch((e) => console.log(e))
                    }
                    else { updateCounter++ }
                }
                if (updateCounter == req.body.s3Address.length) {
                    updateBody = { "s3Address": req.body.s3Address }
                    for (const element of oldFiles) {
                        if (!newFiles.includes(element)) {
                            s3.deleteObject({
                                Bucket: awsConfig.bucket,
                                Key: element
                            }).promise()
                        }
                    }
                }
            }
            if (req.body.patentName) {
                updateBody = {
                    ...updateBody,
                    patentName: req.body.patentName
                }
            }
            if (req.body.description) {
                updateBody = {
                    ...updateBody,
                    description: req.body.description
                }

            }
            if (currentData.status == rejected) {
                updateBody = {
                    $push: {
                        "statusLog": [{ status: resubmitted, message: "Patent Edited and Re-submitted" }],
                        "message": [{ user: req.user.name, userPublicaddress: req.user.id, message: "Patent Edited and Resubmitted by Owner." }]
                    },
                    status: resubmitted
                }
                if (req.body.message) {
                    updateBody = {
                        ...updateBody,
                        $push: { "message": [{ user: req.user.name, userPublicaddress: req.user.id, message: "Resubmit Message: " + req.body.message }] },
                    }
                }
            }
            else {
                updateBody = {
                    ...updateBody,
                    $push: {
                        "statusLog": [{ status: currentData.status, message: "Patent Edited" }],
                        "message": [{ user: req.user.name, userPublicaddress: req.user.id, message: "Patent Edited by user." }]
                    }

                }
            }
            if (!req.body.s3Address || (updateCounter == req.body.s3Address.length)) {
                Patent.findByIdAndUpdate(id, updateBody)
                    .then(data => {
                        res.send({
                            message:
                                "Patent Edited and submitted"
                        });
                    });
            }
            else {
                res.status(400).send({
                    message: "no file found"
                });
            }
            return;
        }
        else next(new BadRequest({ error: "Patent has to be in pending / re-submitted / rejected status to be edited", error_Code: Patent_not_in_applied_or_resubmitted_or_rejected_status }))
    }
    else next(new BadRequest({ error: "Patent not found.", error_Code: Patent_Not_Found }))
}

exports.paymentPendingForPatent = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).send({ message: errors.errors[0].msg });
        return;
    }
    try {
        let id = req.params.id;
        let feesTxHash = req.body.transactionHash;
        const record = await Patent.findOne({ _id: id, publicAddress: req.user.id }, 'status -_id')
        if (record.status == readyForPayment || record.status == paymentFailed) {
            let updateBody = {
                feesTxHash,
                "status": paymentPending,
                $push: { "statusLog": [{ status: paymentPending, message: "Payment sent" }], "message": [{ user: req.user.id, userPublicaddress: req.user.id, message: "Patent payment sent." }] }
            }
            if (updatePatent(id, updateBody)) {
                res.send({
                    message: "Patent moved to payment pending status."
                });
            }
            else {
                next(new BadRequest({ error: "Error updating patent", error_Code: Failed_to_update_patent }))
            }
        }
        else {
            next(new BadRequest({ error: "Patent has to be in readyForPayment or paymentFailed status", error_Code: Patent_not_in_readyForPayment_or_paymentFailed_status }))
        }
    }
    catch (error) {
        res.status(500).send({
            message:
                "Error while marking patent as payment pending: " + error.message
        });
    }
}

exports.readyForSale = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        next(new BadRequest({ message: errors.errors[0].msg }));
        return;
    }
    try {
        let id = req.params.id;
        let baseAmount = Number(req.body.baseAmount);
        const record = await Patent.findOne({ _id: id, publicAddress: req.user.id }, 'status -_id')
        if (record.status == transactionCompleted) {
            let updateBody = {
                transferStatus: readyForSale,
                baseAmount,
                $push: { "message": [{ user: req.user.id, userPublicaddress: req.user.id, message: "Patent marked as Ready For Sale by User." }] }
            }
            if (updatePatent(id, updateBody)) {
                res.send({
                    message:
                        "Patent marked as ready for sale."
                });
            }
            else {
                next(new BadRequest({ error: "Error updating patent.", error_Code: Failed_to_update_patent }))
            }
        }
        else {
            next(new BadRequest({ error: "Patent has to be in transaction completed status", error_Code: Patent_not_in_transactionCompleted_status }))
        }
    } catch (error) {
        res.status(500).send({
            message:
                "Error while marking patent as ready for sale: " + error.message
        });
    }
}

function updatePatent(id, updateBody) {
    const record = Patent.findByIdAndUpdate(id, updateBody)
        .catch(() => {
            console.error({ error: "Failed to update patent", error_Code: Failed_to_update_patent });
        });
    return record;
}


//Create Bid Log
exports.createBid = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        next(new BadRequest({ message: errors.errors[0].msg }));
        return;
    }
    try {
        let id = req.params.id;
        let bidAmount = Number(req.body.bidAmount);
        const record = await Patent.findOne({ _id: id })
        const userRecord = await User.findOne({ _id: record.publicAddress })
        let name = record.patentName
        let username = req.user.name;
        let price = req.body.bidAmount
        const notificationId = Math.floor(Math.random() * 100).toString() + new Date().getTime().toString();

        let bidPayload = {
            data: {
                title: "New Bid for " + name,
                body: "Bid initiated from " + username + " for amount Rs " + price,
                Price: price,
                click_action: "/patentD/" + id

            }
        }

        if (record.transferStatus == readyForSale) {
            if (bidAmount > record.baseAmount) {
                let updateBody = {
                    bidAmount,
                    $push: { "bidLog": [{ "userName": req.user.name, "userPublicAddress": req.user.id, "amount": req.body.bidAmount }] }
                }
                if (updatePatent(id, updateBody) && (userRecord.deviceToken != "")) {
                    const notification = new Notification({
                        patentId: record._id,
                        publicAddress: record.publicAddress,
                        title: bidPayload.data.title,
                        body: bidPayload.data.body,
                        deviceToken: userRecord.deviceToken,
                        click_action: bidPayload.data.click_action,
                        _id: notificationId

                    });
                    notification.save(notification)
                        .then((data) => {
                            console.log(data);
                            console.log("Saved successfully");
                        })
                        .catch((err) => {
                            console.error(`Error notification for createBid for patent: ${id}. \n Error: ${err}`);
                        })
                    admin.messaging().sendToDevice(userRecord.deviceToken, bidPayload)
                        .then(function (response) {
                            res.send({
                                message: "Bid Successfull",
                                response
                            })
                        })
                        .catch(function (error) {
                            res.send({
                                message: "Error sending the message"
                            })
                        });
                }
                else {
                    next(new BadRequest({ error: "Error updating patent.", error_Code: Failed_to_update_patent }))
                }
            }
            else {
                next(new BadRequest({ error: "Bid amount must be greater than base amount", error_Code: bid_amount_less_than_base_amount }))
            }
        }
        else {
            next(new BadRequest({ error: "Patent transfer status must be ready for sale.", error_Code: Patent_not_in_readyForSale_transferStatus }))
        }
    } catch (error) {
        console.error(error)
    }
}

exports.checkFeeTransactionStatus = async (req, res, next) => {
    try {
        let id = req.params.id;
        Patent.findOne({ _id: id }, 'status feesTxHash -_id').then(record => {
            if (record.status !== approved && record.feesTxHash !== undefined) {
                getTransactionStatus(record.feesTxHash).then((status) => {
                    if (status) {
                        if (approvePatent(id)) {
                            res.status(200).send({ message: "Payment SUCCESS" });
                        }
                    }
                    else if (!status) {
                        let updateBody = { status: paymentFailed }
                        updatePatent(id, updateBody);
                        res.status(200).send({ message: "Payment FAILED" });
                    }
                }).catch(
                    (error) => {
                        next(new GeneralError("Error occured. Error: " + error))
                    }
                )
            }
            else {
                res.status(200).send({ message: "Patent already approved." })
            }
        }).catch(
            (error) => {
                next(new GeneralError("Error occured. Error: " + error))
            }
        );
    }
    catch (error) {
        res.status(500).send({
            message:
                "Error  " + error.message
        });
    }
}


///Add device token
exports.notificationToken = async (req, res, next) => {

    const id = req.user.id
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).send({ message: errors.errors[0].msg });
        return;
    }
    try {
        let updateBody = {
            deviceToken: req.body.deviceToken,
        }
        User.findByIdAndUpdate(id, updateBody)
            .then((data) => {
                res.send({
                    message:
                        "Success"
                });
            })
            .catch((err) => {
                res.status(500).send({
                    status: 500,
                    message: "Failed!"
                })
            })
    }
    catch (error) {
        res.status(500).send({
            message:
                "Error  " + error.message
        });
    }
}

//To list notifications

exports.listNotification = (req, res) => {
    let publicAddress = req.user.id;
    Notification.find({ publicAddress: publicAddress }).sort({ createdAt: -1 }).then((data) => {
        res.send({
            message:
                "Success",
            data
        });
    })
        .catch((err) => {
            res.status(500).send({
                status: 500,
                message: "Error occured while sending the notifications",
                err
            })
        })
}

//Update notification status (status=1:read)
exports.updateNotificationStatus = (req, res) => {
    let id = req.params.id;
    let updateBody = {
        status: 1
    }
    if (id != "") {
        Notification.findByIdAndUpdate(id, updateBody)
            .then((data) => {
                res.send({
                    message:
                        "Success"
                });
            })
            .catch((err) => {
                res.status(500).send({
                    status: 500,
                    message: "Failed to update status"
                })
            })
    }
    else {
        res.status(500).send({
            status: 500,
            message: "Notification id is invalid"
        })
    }
}

//To return count based on status(0 or 1)
exports.returnNotificationStatusCount = (req, res) => {
    let publicAddress = req.user.id;
    let status = req.params.status
    if (status < 2) {
        Notification.find({ publicAddress: publicAddress, status: status }).count()
            .then((data) => {
                res.send({
                    message:
                        "Success",
                    count: data
                });
            })
            .catch((err) => {
                res.status(500).send({
                    status: 500,
                    message: err
                })
            })
    }
    else {
        res.status(500).send({
            status: 500,
            message: "Invalid status value"
        })
    }
}

//to be called by patent seller
exports.approveBuyer = async (req, res, next) => {
    const endDate = moment.utc().add(2, 'days');
    try {
        const id = req.params.id;//patent Id
        const seller = req.user.id;
        const buyer = req.body.buyer;
        const price = req.body.price;

        const notificationId = Math.floor(Math.random() * 100).toString() + new Date().getTime().toString();

        const userRecord = await User.findOne({ _id: buyer })

        const sellerRecord = await User.findOne({ _id: seller })

        Patent.findOne({ _id: id, publicAddress: seller }).then(async record => {
            let name = record.patentName

            let sellerName = sellerRecord.name
            let buyerPayload = {
                data: {
                    title: "Offer Approved",
                    body: "Your offer for patent " + name + " has been approved by " + sellerName,
                    click_action: "/patentD/" + record._id

                }
            }
            console.log(buyerPayload);
            if (record.transferStatus == readyForSale) {

                await setTokenBuyer(id, buyer, price).then(data => {

                    let updateBody = {
                        approvedBuyer: buyer,
                        approvedPrice: price,
                        transferStatus: biddingComplete,
                        payment_expiry_date: endDate
                    }
                    if (updatePatent(id, updateBody) && (userRecord.deviceToken != "")) {
                        setTimeout(() => {
                            const updatefield = {
                                transferStatus: readyForSale,
                                approvedBuyer: null,
                                approvedPrice: null,
                                payment_expiry_date: null,
                                $pop: { bidLog: 1 },
                                $push: {
                                    "message": [{ user: "Admin", message: "Payment date expired for the bid. Patent is now available for bidding... " }]
                                }

                            }
                            Patent.findByIdAndUpdate(id, updatefield).catch((error) => {
                                console.error({ error: "Error on setTimeout fn" + error, });
                            });
                        }, 172800000);
                        console.log("inside update patent");

                        const notification = new Notification({
                            patentId: record._id,
                            publicAddress: userRecord.publicAddress,
                            title: buyerPayload.data.title,
                            body: buyerPayload.data.body,
                            deviceToken: userRecord.deviceToken,
                            click_action: buyerPayload.data.click_action,
                            _id: notificationId

                        });
                        notification.save(notification)
                            .then((data) => {
                                console.log(data);
                                console.log("Saved successfully");
                            })
                            .catch((err) => {
                                console.error(`Notification error for approving the patent: ${id}. \n Error: ${err}`);
                            })
                        admin.messaging().sendToDevice(userRecord.deviceToken, buyerPayload)
                            .then(function (response) {
                                console.log("Successfully sent the notification to device token")

                                res.send({
                                    message: "Buyer offer has been approved",
                                    response
                                })
                            })
                            .catch(function (error) {
                                res.send({
                                    message: "Error sending the notification",
                                    error
                                })
                            });


                    }

                    else {
                        next(new BadRequest({ error: "Error while updating patent", error_Code: Failed_to_update_patent }))
                    }
                }).catch(error => {
                    console.error(`Error while setting token buyer for ${id}. Error: ${error}`)
                    next(new BadRequest({ error: "Error while setting token buyer", error_Code: Failed_to_update_patent }))
                })
            }
            else {
                next(new BadRequest({ error: "Patent has to be in readyForSale transferStatus", error_Code: Patent_not_in_readyForSale_transferStatus }))
            }
        }).catch(error => {
            console.error(error)
            next(new BadRequest({ error: "Error while setting token buyer", error_Code: Failed_to_update_patent }))
        })
    }
    catch (error) {
        console.error(error)
        next(new BadRequest({ error: "Approve buyer error", error_Code: "000" }))
    }
}

//to be called by patent buyer
exports.transferPending = async (req, res, next) => {
    try {
        const id = req.params.id;
        const transactonHash = req.body.transactionHash;
        Patent.findOne({ _id: id, approvedBuyer: req.user._id }).then(record => {
            if (record.transferStatus == biddingComplete || record.transferStatus == transferFailed) {
                let updateBody = {
                    transferStatus: transferPending,
                    transferTxHash: transactonHash
                }
                if (updatePatent(id, updateBody)) {
                    res.status(200).send({
                        message: "Patent transfer initiated"
                    })
                }
                else {
                    next(new BadRequest({ error: "Failed to initiate transfer", error_Code: Failed_to_initiate_transfer }))
                }
            }
            else {
                next(new BadRequest({ error: "Patent not in readyForSale transfer status", error_Code: Patent_not_in_readyForSale_transferStatus }))
            }
        })
    } catch (error) {
        console.error(error)
        next(new BadRequest({ error: "Error updating Patent", error_Code: Failed_to_update_patent }))
    }
}

exports.checkTransferTransactionStatus = async (req, res, next) => {
    try {
        let id = req.params.id;
        Patent.findOne({ _id: id }, 'status transferTxHash -_id').then(record => {
            if (record.status === transferPending && transferTxHash !== undefined) {
                getTransactionStatus(record.transferTxHash).then((status) => {
                    if (status) {
                        if (transferPatent(id, record.publicAddress, record.transferTxHash)) {
                            res.status(200).send({ message: "Payment SUCCESS" });
                        }
                    }
                    else if (!status) {
                        let updateBody = { transferStatus: transferFailed }
                        updatePatent(id, updateBody);
                        res.status(200).send({ message: "Payment FAILED" });
                    }
                }).catch(error => {
                    console.error({ Error: `Error when getting transaction status of ${record.transferTxHash}`, Description: error })
                    next(new BadRequest({ error: `Error when getting transaction status of ${record.transferTxHash}`, error_Code: Error_while_checking_transaction_status }))
                });
            }
            res.status(200).send({ message: "Transaction already processed or patent not in transferPending Status" })
        });
    }
    catch (error) {
        res.status(500).send({ error: `Error while checking transaction status of ${req.params.id}: ` + error, error_Code: Error_while_checking_transaction_status });
    }
}

exports.bid_list = async (req, res, next) => {
    const list = await Patent.find(
        { bidLog: { $elemMatch: { userPublicAddress: req.params.id } } }, {
        statusLog: 0, message: 0, transferLog: 0, bidLog: 0, feesTxHash: 0,
        mintTxHash: 0,
        transferTxHash: 0,
    }
    ).lean().catch((err) => {
        next(new GeneralError({ Error: "Error occured while fetching data: " + err, error_Code: Error_while_fetching_patent }))
    })
    if (list) {
        const arrWithStatus = list.map(object => {
            return { ...object, bidStatus: '' };
        });
        arrWithStatus.forEach(object => {
            if (object.approvedBuyer) {

                if (object.approvedBuyer === req.params.id) {
                    object.bidStatus = 'Bid successful';
                }
                else {
                    object.bidStatus = 'Overbidden'
                }
            }
            else if (object.publicAddress === req.params.id) {
                object.bidStatus = 'Patent Acquired';
            }
            else if (object.transferStatus === 0 && object.publicAddress !== req.params.id) {
                object.bidStatus = 'Bidding over'
            }
            else {
                object.bidStatus = 'In progress'
            }
        });
        res.send(arrWithStatus);
    }
    else {
        res.send({ message: "No records found " })
    }
}


exports.paymentExpiryCheck = async (req, res, next) => {
    const id = req.params.id;
    try {
        const today = moment.utc();
        const updatefield = {
            transferStatus: readyForSale,
            approvedBuyer: null,
            approvedPrice: null,
            payment_expiry_date: null,

        }
        Patent.updateOne({ _id: id, transferStatus: 2, payment_expiry_date: { $lt: Date(today) } }, {
            $set: updatefield, $pop: { bidLog: 1 }, $push: {
                "message": [{ user: "Admin", message: "Payment date expired for the bid. Patent is now available for bidding... " }]
            }
        }).then(() => {
            res.send({ message: "Updated" })

        }).catch((error) => {
            next(new GeneralError({ error: "Error on paymentExpiryCheck Util" + error, }));
        });
    } catch (error) {
        next(new GeneralError({ error: "Error on paymentExpiryCheck Util" + error, }));

    }
}