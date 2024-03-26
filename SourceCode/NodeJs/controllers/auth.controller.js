
const db = require("../models");
const jwt = require('jsonwebtoken');
const constants = require('../config/constants.config');
const ethUtil = require('ethereumjs-util');
const role = require("../utils/user-roles.utils");
const { validationResult } = require('express-validator');
const User = db.user;
const Signature = db.signature;

//Refresh Token
exports.refreshToken = (req, res) => {
    try {
        jwt.verify(req.body.refreshToken, 'Inn0v@tur3', function (err, decoded) {
            let currentDate = new Date();
            let token = jwt.sign(
                {
                    expiresIn: "600s",
                    data: decoded.data,
                }, 'Inn0v@tur3'
            )
            let refreshtoken = jwt.sign(
                {
                    expiresIn: "24h",
                    data: decoded.data,
                }, 'Inn0v@tur3'
            )
            let futureDate = new Date(currentDate.getTime() + 10 * 60000);
            let refreshTokenExpTime = new Date(currentDate.getTime() + 24 * 60 * 60000);
            res.send({
                accessToken: token,
                refreshToken: refreshtoken,

                accessTokenExpiresIn: futureDate,

                refreshTokenExpiresIn: refreshTokenExpTime,
            })
        });
    }
    catch {
        res.status(401).send({
            message: `Invalid token`
        });
    }
}

//Login Function
exports.login = (req, res) => {

    if (!req.body.publicAddress) {
        res.status(400).send({ message: "Public Address  cannot be empty " });
        return;
    }

    //Check whether public address already exist or not inside signature table
    Signature.findOne(req.body)
        .then(data => {
            const reqBody = {
                publicAddress: req.body.publicAddress,
                nonce: Math.floor(Math.random() * 1000000)
            }
            Signature.findByIdAndUpdate(data.id, reqBody)
                .then(data => {
                    if (!data) {
                        res.status(404).send({
                            message: `Cannot update user with id=${data.id}. Maybe user was not found!`
                        });
                    }
                })
                .catch(err => {
                    res.status(404).send({
                        message: err.message
                    });
                });
            res.send({
                publicAddress: data.publicAddress,
                nonce: 'P@ten2' + reqBody.nonce.toString()
            });
        })
        .catch(err => {
            // create if not found 
            let signature = new Signature({
                publicAddress: req.body.publicAddress,
                nonce: Math.floor(Math.random() * 1000000),

            })
            signature
                .save(signature)
                .then(data => {

                    res.send({
                        publicAddress: req.body.publicAddress,
                        nonce: 'P@ten2' + data.nonce.toString()
                    });
                })
                .catch(err => {
                    res.status(500).send({
                        message: "Some error occurred while creating the user."
                    });
                });

        });



};

//Verify Signature

exports.verifySign = (req, res) => {

    let userStatus;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).send({ message: errors.errors[0].msg });
        return;
    }

    //Json Object
    let reqBody = {
        publicAddress: req.body.publicAddress

    };
    let reqUserBody = {
        _id: req.body.publicAddress
    };

    //Check whether public address exist in signature table or not
    return (
        Signature.findOne(reqBody)
            .then(data => {
                if (!data)
                    return res.status(401).send({
                        error: `User with publicAddress ${req.body.publicAddress} is not found in database`
                    });
                return data;
            })

            .then(data => {
                const msg = 'P@ten2' + data.nonce.toString();
                // Convert msg to hex string
                const sig = ethUtil.fromRpcSig(ethUtil.addHexPrefix(req.body.signature))
                const msg1 = ethUtil.hashPersonalMessage(Buffer.from(msg))
                const publicKey = ethUtil.ecrecover(msg1, sig.v, sig.r, sig.s)
                const pubAddress = ethUtil.pubToAddress(publicKey)
                const address = ethUtil.addHexPrefix(pubAddress.toString('hex'))
                // The signature verification is successful if the address found with

                if (address.toLowerCase() === req.body.publicAddress.toLowerCase()) {
                    let token = jwt.sign(
                        {
                            data: req.body.publicAddress
                        }, 'Inn0v@tur3',
                        {
                            expiresIn: "600s"
                        }
                    )
                    let refreshtoken = jwt.sign(
                        {
                            data: req.body.publicAddress
                        }, 'Inn0v@tur3',
                        {
                            expiresIn: "24h"
                        }
                    )

                    //Check whether user is already registered or not(status)
                    User.findOne(reqUserBody)
                        .then((data) => {
                            if (data) {
                                userStatus = 1;
                                return res.send({
                                    publicAddress: req.body.publicAddress,
                                    accessToken: token,
                                    refreshToken: refreshtoken,
                                    usertype: data.usertype,
                                    name: data.name,
                                    status: userStatus
                                })
                            }
                            else
                                userStatus = 0;

                            return res.send({
                                publicAddress: req.body.publicAddress,
                                accessToken: token,
                                refreshToken: refreshtoken,
                                usertype: role.Applicant,
                                name: '',
                                status: userStatus
                            })
                        })



                } else {
                    return res
                        .status(401)
                        .send({ error: 'user not found' });
                }
            })
            .catch(error => {
                console.error({Error: error})
            })
    );

};


