const db = require("../models");
const { transferNFT } = require("../utils/blockchain-utils")
const Patent = db.patent;
const User = db.user;
const Notification = db.notification;
const constants = require('../config/constants.config');
const jwt = require('jsonwebtoken');
const { Pending, approved, reviewing, rejected, transactionCompleted, resubmitted, readyForPayment } = require('../utils/patent-status.utils')
const { BadRequest, GeneralError, NotFound, } = require('../utils/errors.js');
const { validationResult } = require('express-validator');
const { user } = require("../models");
const moment = require('moment');
const { initializeApp } = require('firebase-admin/app');

const admin = require("firebase-admin");

const serviceAccount = require("../../testproject-e3650-firebase-adminsdk-qnbeg-dbe2f7165e.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: ""
});
const { updatePatent } = require('../utils/patent.utils')

exports.listPatent = (req, res) => {
    let aggregateQuery = []
    let lookup = {
        $lookup: {
            from: "users",
            localField: "publicAddress",
            foreignField: "_id",
            as: "user"
        }
    }
    let project = {
        $project: {
            _id: 0,
            id: '$_id',
            patentName: 1,
            description: 1,
            status: 1,
            transferStatus: 1,
            createdAt: 1,
            "user.name": 1,
            index: 1
        }
    }
    let query = {}
    let sortParam = {}
    if (req.query.keyword) {
        query.$or = [
            { "patentName": { $regex: req.query.keyword, $options: 'i' } },
            { "description": { $regex: req.query.keyword, $options: 'i' } }
        ]
    }
    if (req.query.status) {
        query.status = Number(req.query.status);
    }
    if (req.query.publicAddress) {
        query.publicAddress = req.query.publicAddress;
    }
    if (req.query.updatedAt) {
        sortParam = {
            updatedAt: Number(req.query.updatedAt)
        }
    }
    else if (req.query.createdAt) {
        sortParam = {
            createdAt: Number(req.query.createdAt)
        }
    }
    let sortKey = Object.keys(sortParam)[0]
    sortParam[sortKey] = (sortParam[sortKey] == -1) ? -1 : 1
    let page = req.query.token ? generateDataFromToken(req.query.token) : 1
    let skipValue = (page - 1) * constants.pageLimit;
    aggregateQuery.push({ $match: query }, { $sort: sortParam }, { $skip: skipValue }, { $limit: constants.pageLimit }, lookup, project, showIndexNumber(skipValue))
    getResultCount(query)
        .then(count => {
            if (!count)
                res.send({
                    data: [],
                    token: ''
                });
            if (count > 0) {
                Patent.aggregate(aggregateQuery)
                    .then(data => {
                        let result = {}
                        if (count > page * constants.pageLimit) {
                            result = {
                                data: [...data],
                                nextToken: generateToken(page + 1)
                            }
                        }
                        else {
                            result = {
                                data: [...data],
                                nextToken: ''
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
async function getResultCount(query) {
    return Patent.count(query)
}
function showIndexNumber(value) {
    let firstIndex = value + 1
    let setQuery = {
        $set: {
            "index": {
                "$function": {
                    "body": "function(firstIndex) {try {row_number+= 1;} catch (e) {row_number= firstIndex;}return row_number;}",
                    "args": [firstIndex],
                    "lang": "js"
                }
            }
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
        updatePatent(id, body)
            .then(data => {
                res.send({
                    message:
                        "success"
                });
            });
    }
    else {
        next(new BadRequest({ error: "Message empty", error_Code: 900 }))
    }
}
exports.statistics = async (req, res) => {
    const UsersCount = await user.count();
    const appliedPatent = await Patent.count();
    const approvedPatent = await Patent.count({ status: transactionCompleted });
    const rejecteddPatent = await Patent.count({ status: rejected });
    res.status(200).send({
        userCount: UsersCount,
        appliedPatent: appliedPatent,
        approvedPatent: approvedPatent,
        rejecteddPatent: rejecteddPatent
    });
}

exports.rejectPatent = async (req, res, next) => {
    const errors = validationResult(req);
    const record = await Patent.findOne({ _id: req.params.id }, 'publicAddress status -_id')
    if (record != "") {
        if (record.status == reviewing) {
            if (!errors.isEmpty()) {
                res.status(400).send({ message: errors.errors[0].msg });
                return;
            }
            let id = req.params.id
            let defaultMessage = { user: req.user.name, userPublicaddress: req.user.id, message: "Patent Rejected by Authority" };
            let body = {

                "status": rejected,
                $push: { "statusLog": [{ status: rejected, message: "Patent Rejected by Authority" }], "message": [defaultMessage] }
            }
            if (req.body.message) {
                body = {
                    ...body,
                    $push: { "message": { $each: [defaultMessage, { user: req.user.name, message: "REJECT REASON: " + req.body.message }] } }

                }
            }
            if (updatePatent(id, body)) {
                res.send({
                    message:
                        "Patent rejected successfully"
                });
            }
            else {
                res.status(500).send({
                    message:
                        "Some error occurred while retrieving Patents."
                });
            }
        } else
            next(new BadRequest({ error: "Patent has to be in reviewing status to be rejected", error_Code: 1004 }))
    }
    else
        next(new BadRequest({ error: "Failed to fetch data", error_Code: 1011 }))
}


exports.findOne = async (req, res) => {
    if (req.params.id) {
        const id = parseInt(req.params.id)
        const record = await Patent.aggregate([

            { $match: { _id: id } },
            {
                $lookup: {
                    from: "users",
                    localField: "publicAddress",
                    foreignField: "_id",
                    as: "user"
                }
            },
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
                    "user.name": 1,
                    buyerName: { $arrayElemAt: ['$buyer.name', 0] },
                }
            }
        ]);
        if (record != " ") {
            if (record[0].status == transactionCompleted) {
                try {
                    let JsonObject = {};
                    let result = { ...record[0], ...JsonObject }
                    res.send(result)
                } catch (err) {
                    console.log("Error while fetching tokenURI")
                    res.send(...record)
                }
            }
            else {
                res.send(...record)
            }
        }
        else {
            next(new BadRequest({ error: "No records found", error_Code: 1001 }))
        }

    }


};
exports.reviewPatent = async (req, res, next) => {
    let id = req.params.id
    const record = await Patent.findOne({ _id: id }, 'publicAddress status -_id')
    if (record != '') {
        if (record.status == Pending || record.status == resubmitted || record.status == rejected) {
            let body = {
                "status": reviewing,
                $push: { "statusLog": [{ status: reviewing, message: "Patent in review" }], "message": [{ user: req.user.name, userPublicaddress: req.user.id, message: "Patent Review in Progress" }] }
            }
            if (updatePatent(id, body)) {
                res.send({
                    message:
                        "Patent moved to review status "
                });
            }
            else {
                res.status(500).send({
                    message:
                        "Some error occurred while retrieving Patents."
                });
            }
        } else
            next(new BadRequest({ error: "Patent has to be in pending / re-submitted status to be reviewed", error_Code: 1002 }))
    }
    else
        next(new BadRequest({ error: "Failed to fetch data", error_Code: 1011 }))

}

exports.readyToApprovePatent = async (req, res, next) => {
    const id1 = Math.floor(Math.random() * 100).toString() + new Date().getTime().toString();

    try {
        let id = req.params.id;
        const record = await Patent.findOne({ _id: id })

        const userRecord = await User.findOne({ _id: record.publicAddress })
        let name = record.patentName

        let paymentPayload = {
            data: {
                title: "Payment",
                body: "Please initiate the payment for " + name,
                click_action: "/patentD/" + id
            }
        }
        console.log(paymentPayload.data.click_action);
        if (record.status == reviewing) {
            let updateBody = {
                "status": readyForPayment,
                $push: { "statusLog": [{ status: readyForPayment, message: "Patent Ready For Approval" }], "message": [{ user: req.user.name, userPublicaddress: req.user.id, message: "Patent ready for approval. Please make payment to continue approval process." }] }
            }
            if (updatePatent(id, updateBody) && (userRecord.deviceToken != "")) {

                
                //Notification
                const notification = new Notification({
                    patentId: record._id,
                    publicAddress: record.publicAddress,
                    title: paymentPayload.data.title,
                    body: paymentPayload.data.body,
                    deviceToken: userRecord.deviceToken,
                    click_action: paymentPayload.data.click_action,
                    _id: id1

                });
                notification.save(notification)
                    .then((data) => {
                        console.log("Saved successfully");
                    })
                    .catch((err) => {
                        console.error(`ERROR in saving notification in readyToApprovePatent for patent: ${id}. \nError: ${err}`);
                    })

                admin.messaging().sendToDevice(userRecord.deviceToken, paymentPayload)
                    .then(function (response) {
                        res.send({
                            message: "Successfully sent the response and Patent moved to ready for approval status",
                            response
                        })
                    })
                    .catch(function (error) {
                        console.log("Error sending message:", error);
                        res.send({
                            message: "Error sending the message"
                        })
                    });


            }
            else {
                next(new BadRequest({ error: "Error while updating", error_Code: 1050 }))
            }
        }
        else {
            next(new BadRequest({ error: "Patent has to be in reviewing status", error_Code: 1003 }))
        }


    }
    catch (error) {
        res.status(500).send({
            message:
                "Error while marking patent as ready for approval: " + error.message
        });
    }
}




exports.getUserAnalytics = (req, res) => {
    try {
        let aggregateQuery = [
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    numberOfUsers: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: '$_id.month',
                    year: '$_id.year',
                    numberOfUsers: 1
                }
            }, { $sort: { year: 1, month: 1 } }
        ]
        if (req.query.year) {
            aggregateQuery.push({ $match: { year: Number(req.query.year) } })
        }
        User.aggregate(aggregateQuery).then(data => {
            res.send(data)
        })
    }
    catch (err) {
        res.status(500).send({
            message: "Error ", err
        })
    }
}

exports.getPatentAnalytics = (req, res) => {
    try {
        let aggregateQuery = [
            { $set: { lastElement: { $arrayElemAt: ["$statusLog", -1] } } },
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: '$lastElement.statusDate' },
                        month: { $month: '$lastElement.statusDate' },
                        year: { $year: '$lastElement.statusDate' },
                        status: '$lastElement.status'
                    },
                    count: { $sum: 1 }
                }
            },


        ]
        let displayCounts = {
            $group: {
                _id: {},
                counts: {
                    $push: {
                        "status": "$_id.status",
                        "count": "$count"
                    }
                }
            },


        }
        if (req.query.year) {
            displayCounts.$group._id.month = "$_id.month";
            displayCounts.$group._id.year = "$_id.year";
            aggregateQuery.push({ $match: { "_id.year": Number(req.query.year) } })
        }
        if (req.query.month) {
            displayCounts.$group._id.day = "$_id.day";
            displayCounts.$group._id.month = "$_id.month";
            aggregateQuery.push({ $match: { "_id.month": Number(req.query.month) } })
        }
        if (req.query.day) {
            aggregateQuery.push({ $match: { "_id.day": Number(req.query.day) } })

        }
        aggregateQuery.push(displayCounts, { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } })
        Patent.aggregate(aggregateQuery).then(data => {
            let result = []
            data.forEach(element => {
                let applied = 0, approved = 0, rejected = 0;
                element.counts.forEach(value => {
                    if (value.status == 4)
                        approved += value.count
                    else if (value.status == 3)
                        rejected += value.count
                    else if (value.status == 0)
                        applied += value.count
                })
                let formattedObject = { day: element._id.day, month: element._id.month, year: element._id.year, counts: { applied, approved, rejected } }
                result.push(formattedObject)
            })
            res.send(result)
        })
    } catch (err) {
        res.status(500).send({
            message: "Error while fetching patent analytics" + err
        })
    }
}


//daily patent analytics returns data currespond to a week 

exports.patentAnalytics_week = async (req, res, next) => {
    const startDate = moment.utc(req.query.start, "YYYY-MM-DD").toDate();
    const endDate = moment.utc(req.query.start, "YYYY-MM-DD").add(1, 'weeks').toDate();
    let aggregateQuery = [
        { $set: { lastElement: { $arrayElemAt: ["$statusLog", -1] } } },
        {
            $group: {
                _id: {
                    statusDate: { $dateToString: { format: "%Y-%m-%d", date: "$lastElement.statusDate" } },
                    status: '$lastElement.status'
                },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: {
                    date: "$_id.statusDate",
                },
                counts: {
                    $push: {
                        "status": "$_id.status",
                        "count": "$count"
                    }
                }
            }

        },
        { $set: { statusDate: { $dateFromString: { dateString: "$_id.date" } } } },
    ]
    aggregateQuery.push({ $match: { statusDate: { $gte: startDate, $lte: endDate } } })
    aggregateQuery.push({
        $project: {
            _id: 1,
            counts: 1
        }
    })

    const dailyAnalytics = await Patent.aggregate(aggregateQuery).then(data => {
        return data;
    })
        .catch(err => {
            next(new GeneralError("Error while fetching patent analytics" + err))
        })
    let result = this.formatArray(dailyAnalytics);
    let start = new Date(req.query.start);
    let arrayToMerge = []
    for (let i = 0; i < 7; i++) {

        let date = new Date(start.setDate(start.getDate() + 1))
        let year = date.toLocaleString("default", { year: "numeric" });
        let month = date.toLocaleString("default", { month: "2-digit" });
        let day = date.toLocaleString("default", { day: "2-digit" });

        // Generate yyyy-mm-dd date string
        let formattedDate = year + "-" + month + "-" + day;
        let ob = {
            "date": formattedDate,
            counts: {
                "applied": 0,
                "approved": 0,
                "rejected": 0
            }
        }
        arrayToMerge.push(ob);

    }
    const response = this.mergeArray([...arrayToMerge, ...result])
    res.send(response);

}

exports.formatArray = (data) => {
    let result = []
    data.forEach(element => {
        let applied = 0, approved = 0, rejected = 0;
        element.counts.forEach(value => {
            if (value.status == 4)
                approved = value.count
            else if (value.status == 3)
                rejected = value.countFr
            else if (value.status == 0)
                applied = value.count
        })
        let formattedObject = { date: element._id.date, counts: { applied, approved, rejected } }
        result.push(formattedObject)
    })
    return result;
}

exports.mergeArray = (data) => {
    data.sort((a, b) => new Date(a.date) - new Date(b.date))
    let res = []
    let counter = 1;
    data.forEach(function (e) {
        if (!this[e.date]) {
            this[e.date] = { date: e.date, counts: { applied: null, approved: null, rejected: null } }
            res.push(this[e.date])
        }
        this[e.date] = Object.assign(this[e.date], e)
        if (counter === data.length) {
            this[e.date] = undefined;
        }
        counter++

    })

    return res;
}

exports.transferPatent = async (req, res, next) => {
    transferNFT(req.body.patentId, req.body.buyer).then(hash => {
        let updateBody = {
            publicAddress: buyer,
            transferHash: hash,
            $push: {
                "message": [{ user: req.user.name, userPublicaddress: req.user.id, message: `Patent transferred from ${userId} to ${buyer}` }]
            }
        }
        updatePatent(req.body.patentId, updateBody).then(() => {
            console.log("Update success")
            res.send({
                message: "Patent Transferred Successfully!"
            })
        })
    }).catch(err => {
        res.status(400).send({
            message: { error: "Patent could not be transferred", error_code: 1110 }
        })
    })

}
