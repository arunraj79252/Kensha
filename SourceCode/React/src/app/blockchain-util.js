// import axios from 'axios';
import Web3 from 'web3';
// import { NFTContract } from '../contract-abi/NFT.json';
const {  goerliContractAddress } = require('../contract-abi/ethereumConfig');


// const base_url = process.env.REACT_APP_API_ENDPOINT;


const getPatentFees=()=> {
    return new Promise((resolve) => {
    const web3Provider =new Web3(window.ethereum)
    const web3 = new Web3(web3Provider)
    const NFTContract = require('../contract-abi/NFT.json');
    const NFT = new web3.eth.Contract(NFTContract.abi, goerliContractAddress)
    NFT.methods._patentFees().call({ from: "0x0000000000000000000000000000000000000000" }).then(patentFees => {
        console.log("Patent fees = ", patentFees)
        resolve( patentFees);
    })
})
}

const getUserBalance = async () => {
    return new Promise((resolve) => {
        const web3Provider = new Web3(window.ethereum)
        const web3 = new Web3(web3Provider)
        if (window.ethereum) {
            window.ethereum
                .request({ method: "eth_requestAccounts" })
                .then(async (accounts) => {
                    //             // const balance = await web3.eth.getBalance(accounts[0]);

                    //             // return balance
                    //             return new Promise((resolve) => {
                    //                 setTimeout(() => {
                    resolve(web3.eth.getBalance(accounts[0]))
                    //                 }, 3000);

                    //             })

                })
        }

    })
    // const web3Provider = new Web3(window.ethereum)
    // const web3 = new Web3(web3Provider)
    // if (window.ethereum) {
    //     window.ethereum
    //         .request({ method: "eth_requestAccounts" })
    //         .then(async (accounts) => {
    //             // const balance = await web3.eth.getBalance(accounts[0]);

    //             // return balance
    //             return new Promise((resolve) => {
    //                 setTimeout(() => {
    //                     resolve(web3.eth.getBalance(accounts[0]))    
    //                 }, 3000);

    //             })

    //         })
    // }
}


const payPatentFees = async (tokenId, axios) => {
    // const patentFees = getPatentFees();
    // let getBalance = await getUserBalance()  
    // console.log(getBalance); 
    // return new Promise((resolve) => {
    //     const web3Provider = new Web3(window.ethereum)
    //     console.log(goerliNode);
    //     const web3 = new Web3(web3Provider)
    //     const NFTContract = require('../contract-abi/NFT.json');
    //     console.log(NFTContract);
    //     const NFT = new web3.eth.Contract(NFTContract.abi, goerliContractAddress)
    //     if (window.ethereum) {
    //         window.ethereum
    //             .request({ method: "eth_requestAccounts" })
    //             .then((accounts) => {
    //                 NFT.methods.payPatentFees(tokenId).send({ from: accounts[0], value: 1000 })
    //                     .on('transactionHash', async function (hash) {
    //                         let body = {
    //                             transactionHash: hash
    //                         }
    //                         let path = base_url + "users/me/patents/paymentPending/" + tokenId
    //                         await axios().patch(path, body).then((res) => {
    //                             console.log(res);
    //                         }).catch((error) => {
    //                             console.log(error);
    //                         })


    //                     }).then((data) => {
    //                         console.log("pay patent fees success")
    //                         console.log(data);
    //                         resolve(data)
    //                     }).catch((error) => {
    //                         if (error.code) {
    //                             resolve(-1)
    //                         }
    //                         resolve(0)
    //                     })

    //             }).catch((error)=>{
    //                 console.log(error);
    //             })
    //     }
    // })

}
// const listPatentForSale = async (tokenId) => {
//     return new Promise((resolve) => {
//         const web3Provider = new Web3(window.ethereum)
//         const web3 = new Web3(web3Provider)
//         const NFTContract = require('../contract-abi/NFT.json');
//         const NFT = new web3.eth.Contract(NFTContract.abi, goerliContractAddress)
//         if (window.ethereum) {
//             window.ethereum
//                 .request({ method: "eth_requestAccounts" })
//                 .then((accounts) => {
//                     NFT.methods.giveApprovalToContract(tokenId).send({ from: accounts[0] })
//                         .then(() => {
//                             console.log("approve success");
//                             resolve(1)
//                         }).catch((error) => {
//                             console.log(error, "err");
//                             resolve(0)
//                         })
//                 }).catch((error)=>{
//                     resolve(-1)
//                 })

//         }
//     })

// }

// const buyPatent = async (tokenId, amount,axios) => {
//     return new Promise((resolve) => {
//         // console.log(Web3.utils.toWei(""+amount, "ether") );
//         const web3Provider = new Web3(window.ethereum)
//         const web3 = new Web3(web3Provider)
//         const NFTContract = require('../contract-abi/NFT.json');
//         const NFT = new web3.eth.Contract(NFTContract.abi, goerliContractAddress)

//         if (window.ethereum) {
//             window.ethereum
//                 .request({ method: "eth_requestAccounts" })
//                 .then((accounts) => {
//                     NFT.methods.buyNft(""+tokenId).send({ from: accounts[0], value: Web3.utils.toWei(""+amount, "ether") })
//                     .on('transactionHash', async function (hash) {
//                         let body = {
//                             transactionHash: hash
//                         }
//                         let path = base_url + "users/me/patents/transferPending/" + tokenId
//                         await axios().patch(path, body).then((res) => {
//                             console.log(res);
//                         }).catch((error) => {
//                             console.log(error);
//                         })


//                     })
//                         .then(() => {
//                             console.log("buy patent success")
//                             resolve(1)
//                         }).catch((error)=>{
//                             if (error.code) {
//                                 resolve(-1)
//                             }
//                             console.log(error);
//                             resolve(0)
//                         })
//                 }).catch((error)=>{
//                     console.log(error);
//                 })

//         }
//     })

// }
export default payPatentFees;
export {getPatentFees, getUserBalance }