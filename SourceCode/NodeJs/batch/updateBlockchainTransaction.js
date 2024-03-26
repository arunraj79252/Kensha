const db = require("../models");
const Web3 = require('web3');
const User = db.user;
const { updateTransactionStatus } = require('../utils/blockchain-utils')
const { goerliNode } = require('../../Ethereum/config/ethereum.config');
const web3Provider = new Web3.providers.HttpProvider(goerliNode)
const web3 = new Web3(web3Provider)
const admin = require("firebase-admin");
const transferStatus = require('../utils/transfer-status.utils')
const Patent = db.patent;
const { approved, paymentPending, transactionCompleted } = require("../utils/patent-status.utils");
const { transferPending, biddingComplete } = require("../utils/transfer-status.utils");
const { approvePatent, transferPatent } = require("../utils/patent.utils");
const loggerUtils = require("../utils/logger.utils");
const moment = require('moment');
const { readyForSale } = require("../utils/transfer-status.utils");
const Notification = db.notification;


module.exports = () => {
    setInterval(() => {
        updateMintStatus();
        patentFeeTransaction();
        patentTransfer();
        mintApprovedTransactions();
        paymentExpiryCheck();
    }, 60000);
}

function updateMintStatus() {
    try {
        const id1 = Math.floor(Math.random() * 100).toString() + new Date().getTime().toString();

        Patent.find({ status: approved })
            .then(patent => {
                patent.forEach(async function (record) {

                    const userRecord = await User.findOne({ _id: record.publicAddress })
                    console.log(userRecord);

                    let name = record.patentName;
                    let approvedPayload = {
                        data: {
                            title: "Approved",
                            body: "Your patent " + name + " has been approved.",
                            click_action: "/patentD/" + record._id
                        }
                    }
                    console.log(approvedPayload.data);
                    if (record.mintTxHash != undefined && record.mintTxHash.startsWith("0x")) {
                        web3.eth.getTransactionReceipt(record.mintTxHash)
                            .then(function (receipt, err) {
                                if (receipt) {
                                    if ((receipt.status) && (userRecord.deviceToken != "")) {

                                        updateTransactionStatus(record.id, record.mintTxHash, transactionCompleted, "NFT Minted Successfully", record.publicAddress)


                                        const notification = new Notification({
                                            patentId: record._id,
                                            publicAddress: record.publicAddress,
                                            title: approvedPayload.data.title,
                                            body: approvedPayload.data.body,
                                            deviceToken: userRecord.deviceToken,
                                            click_action: approvedPayload.data.click_action,
                                            _id: id1

                                        });

                                        console.log(notification);
                                        notification.save(notification)
                                            .then((data) => {
                                                console.log(data);
                                                console.log("Saved successfully");
                                            })
                                            .catch((err) => {
                                                console.log(err);
                                            })


                                        admin.messaging().sendToDevice(userRecord.deviceToken, approvedPayload)
                                            .then(function (response) {
                                                console.log(response);
                                                console.log("Successfully sent the response");

                                            })
                                            .catch(function (error) {
                                                console.log("Notification error:" +error);

                                            });




                                        console.log("Mint success for patent: " + record._id)
                                    }
                                }
                                else {
                                    console.log("Transaction awaiting confirmation for patent mint: " + record.id)
                                }
                            }).catch(err => {
                                console.error(`Error in patent transfer batch for record: ${record._id} \n` + err)
                            })
                        {
                            return
                        }
                    }
                });
            }).catch((error) => {
                console.error({ error: "Error while fetching transaction hash " + error });
            });
    } catch (error) {
        console.error("Error in BATCH: updateMintStatus \n Error: " + error)
    }
}


function patentFeeTransaction() {
    try {
        Patent.find({ status: paymentPending, feesTxHash: { $ne: "" }, mintTxHash: { $eq: "" } })
            .then(patent => {
                patent.forEach(function (record) {
                    if (record.feesTxHash != undefined && record.feesTxHash.startsWith("0x")) {
                        web3.eth.getTransactionReceipt(record.feesTxHash)
                            .then(function (receipt, err) {
                                if (receipt) {
                                    if (receipt.status) {
                                        updateTransactionStatus(record.id, record.feesTxHash, approved, "Payment has been confirmed", record.publicAddress)
                                        approvePatent(record._id)
                                        console.log("Fee Payment success for patent: " + record._id)
                                    }
                                }
                                else {
                                    console.log("Transaction awaiting confirmation for patent fee payment: " + record.id)
                                }
                            }).catch(err => {
                                console.error(`Error in patent transfer batch for record: ${record._id} \n` + err)
                            })
                        {
                            return
                        }
                    }
                });
            }).catch((error) => {
                console.error({ error: "Error while fetching transaction hash " + error });
            });
    } catch (error) {
        console.error("Error in BATCH: patentFeeTransaction \n Error: " + error)
    }

}


function patentTransfer() {
    try {
        Patent.find({ transferStatus: transferPending, transferTxHash: { $ne: "" } })
            .then(patent => {
                patent.forEach(function (record) {
                    if (record.transferTxHash.startsWith("0x")) {
                        web3.eth.getTransactionReceipt(record.transferTxHash)
                            .then(function (receipt, err) {
                                if (receipt) {
                                    if (receipt.status) {
                                        if (transferPatent(record._id, record.publicAddress, receipt.transactionHash)) {
                                            console.log("Transfer success for patent: " + record._id)
                                        }
                                        else {
                                            console.log("Transfer error for patent " + record._id)
                                        }
                                    }
                                }
                                else {
                                    console.log("Transaction awaiting confirmation for patent transfer: " + record.id)
                                }
                            }).catch(err => {
                                console.error(`Error in patent transfer batch for record: ${record._id} \n` + err)
                            })
                        {
                            return
                        }
                    }
                });
            }).catch((error) => {
                console.error({ error: "Error while fetching transaction hash " + error, });
            });
    } catch (error) {
        console.error("Error in BATCH: patentTransfer \n Error: " + error)
    }
}

function mintApprovedTransactions() {
    try {
        Patent.find({ status: approved, mintTxHash: { $eq: "" } })
            .then(patent => {
                patent.forEach(function (record) {
                    approvePatent(record._id)
                });
            }).catch((error) => {
                console.error({ error: "Error while fetching transaction hash " + error, });
            });
    } catch (error) {
        console.error("Error in BATCH: mintApprovedTransactions \n Error: " + error)
    }
}


function paymentExpiryCheck() {

    try {
        const today = moment.utc();
        const updatefield = {
            transferStatus: readyForSale,
            approvedBuyer: null,
            approvedPrice: null,
            payment_expiry_date: null,

        }
        Patent.updateMany({ transferStatus: 2, payment_expiry_date: { $lt: Date(today) } }, {
            $set: updatefield, $pop: { bidLog: 1 }, $push: {
                "message": [{ user: "Admin", message: "Payment date expired for the bid. Patent is now available for bidding... " }]
            }
        }).catch((error) => {
            console.error({ error: "Error on paymentExpiryCheck batch" + error, });
        });
    } catch (error) {
        console.error("Error in BATCH: paymentExpiryCheck \n Error: " + error)

    }
}



