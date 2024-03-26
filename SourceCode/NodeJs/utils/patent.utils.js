const db = require("../models");
const NFT = require("./blockchain-utils")
const Patent = db.patent;
const { BadRequest, GeneralError } = require('../utils/errors.js');
const crypto = require('crypto');
const AWS = require('aws-sdk');
const awsConfig = require('../config/aws.config');
const { approved, paymentPending } = require("./patent-status.utils");
const { notForSale } = require("./transfer-status.utils");
require('dotenv').config();

const approvePatent = async (id) => {
    try {
        updatePatent(id, { status: approved }).then(async record => {
            NFT.mintNFT(id, JSON.stringify(await getJsonObject(id)), record.publicAddress).then(mintTxHash => {
                console.log("MINTNFT invoked for ", id)
                let body = {
                    "mintTxHash": mintTxHash,
                    $push: {
                        "statusLog": [{ status: approved, message: "Patent Approved by Authority" }],
                        "message": [{ user: "Admin", message: "Patent Approved by Authority" }],
                        "transferLog": [{ seller: null, buyer: record.publicAddress }],
                    }
                }
                if (updatePatent(id, body)) {
                    console.log("Patent approved!")
                    return true
                }
                else {
                    console.log("error updating patent")
                    return false
                }
            }).catch(err => {
                console.error({ error: "Error while minting NFT: " + err.message, Patent: id })
                return false;
            });
        }).catch(error => {
            console.error(`Error while updating patent ${id} to approved. Error: ${error}`)
        })
    }
    catch (error) {
        console.error({ error: "Error while approving patent: " + error.message, Patent: id })
        return false
    }
}

const getJsonObject = async (patentId) => {
    return new Promise(function (resolve, reject) {
        Patent.findOne({ _id: patentId }, 's3Address -_id').then(data => {
            const jsonObject = {
                "patentId": patentId
            };
            const key = "fileDetails";
            jsonObject[key] = [];
            data.s3Address.forEach(async (file, index, array) => {
                await generateFileHash(file).then(fileHash => {
                    const data = {
                        fileName: file,
                        fileHash: fileHash
                    }
                    jsonObject[key].push(data)
                    if (index == array.length - 1)
                        resolve(jsonObject)
                })
            })
        })
            .catch(err => {
                console.log("Error occured while fetching patent details: " + err)
            })
    })
}

const generateFileHash = async (fileName) => {
    const s3 = new AWS.S3();
    AWS.config.update(
        {
            accessKeyId: process.env.accessKeyId,
            secretAccessKey: process.env.secretAccessKey,
            region: awsConfig.region
        }
    );
    const params = {
        Bucket: awsConfig.bucket,
        Key: fileName
    };
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = s3.getObject(params).createReadStream();
        stream.on('data', (d) => hash.update(d));
        stream.on('end', () => {
            const digest = hash.digest('hex');
            resolve(digest);
        });
        stream.on('error', reject);
    });
}

function updatePatent(id, updatefield) {
    const record = Patent.findByIdAndUpdate(id, updatefield)
        .catch(() => {
            throw new GeneralError({ error: "Failed to update patent", error_Code: 1101 });
        });
    return record;
}

const transferPatent = async (id, previousOwner, transactionHash) => {
    try {
        await NFT.getCurrentOwnerOfNFT(id).then(currentOwner => {
            currentOwner = currentOwner.toLowerCase();
            let updateBody = {
                transferStatus: notForSale,
                publicAddress: currentOwner,
                approvedBuyer: "",
                approvedPrice: "",
                baseAmount: 0,
                bidLog: [],
                payment_expiry_date: null,
                transferTxHash: transactionHash,
                $push: {
                    "message": [{ user: "Admin", message: `Patent transferred to ${currentOwner} \n(Transaction Hash: ${transactionHash}) ` },],
                    "transferLog": [{ seller: previousOwner, buyer: currentOwner }]
                }
            }
            return !!(updatePatent(id, updateBody));
        }).catch(err => {
            console.error({ error: "Error while fetching current owner of NFT: " + err, Patent: id })
            return false
        });

    } catch (error) {
        console.error({ Failed: "Error while patent transfer " + id, Error: error })
    }
}

module.exports = {
    approvePatent,
    updatePatent,
    transferPatent
}