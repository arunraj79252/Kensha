const { getTokenURI } = require("../utils/blockchain-utils")
const db = require("../models");
const Patent = db.patent;
const constants = require('../config/constants.config');
const jwt = require('jsonwebtoken');
const { transactionCompleted } = require('../utils/patent-status.utils')
const { BadRequest } = require('../utils/errors.js');

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
        }
    }
    const query = {}
    let sortParam = {}
    if (req.query.keyword) {
        query.$or = [
            { "patentName": { $regex: req.query.keyword, $options: 'i' } },
            { "description": { $regex: req.query.keyword, $options: 'i' } }
        ]
    }
    query.status = transactionCompleted;
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
    let sortKey = Object.keys(sortParam)[0]
    sortParam[sortKey] = (sortParam[sortKey] == -1) ? -1 : 1
    const page = req.query.token ? generateDataFromToken(req.query.token) : 1
    let skipValue = (page - 1) * constants.pageLimit
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
                                token: generateToken(page + 1)
                            }
                        }
                        else {
                            result = {
                                data: [...data],
                                token: ''
                            }
                        }
                        if (page > 1) {
                            result = { ...result, previousToken: generateToken(page - 1) }
                        }
                        else {
                            result = { ...result, previousToken: '' }
                        }
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
    return await Patent.count(query)
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

exports.findOne = async (req, res, next) => {
    const id = parseInt(req.params.id)
    let query = {}
    query._id = id
    query.status = transactionCompleted;
    const record = await Patent.aggregate([

        { $match: query },
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
                mintTxHash: 1,
                status: 1,
                transferStatus: 1,
                transferLog: 1,
                bidLog: 1,
                baseAmount: 1,
                createdAt: 1,
                approvedBuyer: 1,
                approvedPrice: 1,
                payment_expiry_date: 1,
                "user.name": 1,
                buyerName: { $arrayElemAt: ['$buyer.name', 0] },
            }
        }
    ])
    if (record != "") {
        try {
            let JsonObject = {};
            const result = { ...record[0], ...JsonObject }
            res.send(result)
        } catch (err) {
            console.log("Error while fetching tokenURI")
            res.send(...record)
        }
    }
    else {
        next(new BadRequest({ error: "No records found", error_Code: 1001 }))
    }
};




