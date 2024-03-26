const logger = require('../utils/logger.utils')
const patentStatus = require('../utils/patent-status.utils')
const db = require("../models");
const Patent = db.patent;
const Web3 = require('web3');
const NFTContract = require("../../Ethereum/ContractABIs/NFT.json")
const { goerliNode, goerliContractAddress, goerliChainId } = require('../../Ethereum/config/ethereum.config');
require('dotenv').config();
const web3Provider = new Web3.providers.HttpProvider(goerliNode)
const web3 = new Web3(web3Provider)
const NFT = new web3.eth.Contract(NFTContract.abi, goerliContractAddress)
const transferStatus = require('../utils/transfer-status.utils');
const { approvePatent } = require('./patent.utils');

exports.getTokenURI = async (tokenId) => {
    return new Promise(async function (resolve, reject) {
        try {
            let result = NFT.methods._tokenURIOf(tokenId).call()
            resolve(result)
        } catch (err) {
            console.log("Error while fetching token URI.")
            reject(err)
        }
    })
}

exports.getCurrentOwnerOfNFT = async (tokenId) => {
    return new Promise(async function (resolve, reject) {
        try {
            let result = NFT.methods._currentTokenOwnerOf(tokenId).call()
            resolve(result)
        } catch (err) {
            console.log("Error while fetching token URI.")
            reject(err)
        }
    })
}

exports.mintNFT = async (tokenId, tokenURI, tokenOwner) => {
    const tx = NFT.methods.mint(tokenId, tokenURI, tokenOwner);
    const gas = await tx.estimateGas({ from: process.env.authorityAddress });
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();
    const nonce = await web3.eth.getTransactionCount(process.env.authorityAddress);
    const signedTx = await web3.eth.accounts.signTransaction(
        {
            to: goerliContractAddress,
            data,
            gas,
            gasPrice,
            nonce,
            chainId: goerliChainId
        },
        process.env.authorityPrivateKey
    );
    web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('transactionHash', txHash => {
        return txHash
    }).on('receipt', function (receipt) {
        if (receipt.status) {
            updateTransactionStatus(tokenId, receipt.transactionHash)
        }
    }).on('error', function (error) { console.error(`Error in mintNFT for patent: ${tokenId}. \n Error: ${error}`) })
    return signedTx.transactionHash;
}

exports.updateTransactionStatus = async (patentId, transactionHash, status, message, publicAddress) => {
    let updatefield = {}
    if (status === transferStatus.readyForSale) {
        updatefield = {
            publicAddress: await this.getCurrentOwnerOfNFT(patentId),
            status: status,
            transferStatus: transferStatus.notForSale,
            baseAmount: 0,
            $push: {
                "message": [{ user: "Admin", message: `${message} \n(Transaction Hash: ${transactionHash}) ` },],
                "transferLog": [{ seller: publicAddress, buyer: await this.getCurrentOwnerOfNFT(patentId) }]
            }
        }
    }
    else {
        updatefield = {
            status: status,
            $push: {
                "statusLog": [{ status: status, message: message }],
                "message": [{ user: "Admin", message: `${message} \n(Transaction Hash: ${transactionHash}) ` }]
            }
        }
    }

    Patent.findByIdAndUpdate(patentId, updatefield)
        .then(data => {
            console.log(`Patent: ${patentId} has been updated.`)
        })
        .catch(err => {
            console.error(`Error in updateTransactionStatus for patent: ${patentId}. \nError: ${err}`)
        });
    logger.info(`Transaction Hash: ${transactionHash} \n
                     Status: ${true}
                     PatentID: ${patentId}`)
}

exports.setTokenBuyer = async (tokenId, buyer, price) => {
    const priceInWei = Web3.utils.toWei(price.toString(), "ether");
    const tx = NFT.methods.setTokenBuyer(tokenId, buyer, priceInWei);
    const gas = await tx.estimateGas({ from: process.env.authorityAddress });
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();
    const nonce = await web3.eth.getTransactionCount(process.env.authorityAddress);
    const signedTx = await web3.eth.accounts.signTransaction(
        {
            to: goerliContractAddress,
            data,
            gas,
            gasPrice,
            nonce,
            chainId: goerliChainId
        },
        process.env.authorityPrivateKey
    );
    web3.eth.sendSignedTransaction(signedTx.rawTransaction).on('transactionHash', txHash => {
        return txHash
    }).on('receipt', function (receipt) {
        if (receipt.status) {
            console.log("Token Buyer set for patent " + tokenId)
        }
    })
    .on('error', error =>{
        console.error(`Error while setting token buyer for ${tokenId}. Error: ${error}`)
    });
    return signedTx.transactionHash;
}

exports.getTransactionStatus = (txnHash) => {
    return new Promise(async function (resolve, reject) {
        try {
            web3.eth.getTransactionReceipt(txnHash).then(receipt => {
                if (receipt.status)
                    resolve(true)
                else
                    resolve(false)
            }).catch(error => {
                console.error("Error while checking transaction status. Error: "+ error)
                reject(err)
            });
        } catch (error) {
            console.error("Error while checking transaction status. Error: "+ error)
            reject(err)
        }
    })
}