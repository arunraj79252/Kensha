import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Table from 'react-bootstrap/Table';
import useAppContext from "../AppContext";
import styled from "styled-components";
import Moment from 'moment';
import getStatusName from "../app/Status";
import Button from "react-bootstrap/Button";
import Modal from 'react-bootstrap/Modal';
import { toast } from "react-toastify";
import { getUserBalance } from "./blockchain-util";
import PaymentModal from "./paymentModal";
import Web3 from 'web3';
const { goerliContractAddress } = require('../contract-abi/ethereumConfig');
const Border = styled.div`
  /* border-bottom: solid 1px; */
  border-top: solid 1px;
`;
const Break = styled.span`
  word-break: break-word;
`;

export default function PatentDetails() {
  const appContext = useAppContext();
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const [patentDetail, setPatentDetail] = useState([]);
  const [owner, setOwner] = useState()
  const params = useParams()
  const [etherScanToken,setEtherScanToken] =useState('')
  let patentId = params.id;
  const [readyToSell, setReadyToSell] = useState(false);
  const [price,setPrice] =useState('0.0')
  const [basePrice,setBasePrice] =useState('0.0')
  const [show, setShow] = useState(false);
  const [enableButton,setEnableButton] = useState(false)
  const [stepValue,setStepValue] =useState(.01)
  const [transferStatus,setTransferStatus] = useState(false)
  const [publicAddress,setPublicAddress] = useState('')
  const [expiryTime, setExpiryTime] = useState("");
  const [diffTime,setDiffTime] = useState(-1)
  const [initial,setInitial] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [stepStatus, setStepStatus] = useState(0);
  const [countdownTime, setCountdownTime] = useState({
    countdownDays: "",
    countdownHours: "",
    countdownMinutes: "",
    countdownSeconds: "",
  });

  const handleClose = () => {
    setEnableButton(true)
    getPatentDetails()
    setShow(false);
  }

  const handleShow = () => {
    setShow(true);
  }

  useEffect(() => {

    if (patentDetail.approvedBuyer) {
      
      const timeInterval = setInterval(() => {

        const currentTime = new window.Date().getTime();
        const countdownDateTime = new window.Date(expiryTime).getTime();
        const remainingDayTime = countdownDateTime - currentTime;
  
  
        if (!isNaN(remainingDayTime)) {
          const totalDays = Math.floor(remainingDayTime / (1000 * 60 * 60 * 24));
  
          const totalHours = Math.floor(
            (remainingDayTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const totalMinutes = Math.floor(
            (remainingDayTime % (1000 * 60 * 60)) / (1000 * 60)
          );
          const totalSeconds = Math.floor(
            (remainingDayTime % (1000 * 60)) / 1000
          );
  
          const runningCountdownTime = {
            countdownDays: totalDays,
            countdownHours: totalHours,
            countdownMinutes: totalMinutes,
            countdownSeconds: totalSeconds,
          };
          setDiffTime(remainingDayTime)
  
  
  
  
          setCountdownTime(runningCountdownTime);
  
  
          if (remainingDayTime < 0) {
            clearInterval(timeInterval);
            setExpiryTime(false);
            checkExpiry()
            
          }
        }
  
  
      }, 1000);
      return() =>{
        clearInterval(timeInterval);
        setInitial(false)
      }


    }


  },[initial])

  const checkExpiry =async() =>{
    let path =base_url+"users/me/patents/checkExpiry/"+patentId
      await appContext.getAxios().patch(path).then(()=>{
              setTimeout(() => {
               getPatentDetails()
              }, 500);
      })
  }

  useEffect(() => {
    getPatentDetails();
    setPublicAddress(localStorage.getItem("accountAddress"))
  }, []);
  useEffect(()=>{
    if(price>basePrice){
      setEnableButton(true)
    }
    else{
      setEnableButton(false)
    }
    if (basePrice>0) {
      setStepValue(1/(Math.pow(10,basePrice.toString().split(".")[1].length)))  
    }
    
    console.log();
  },[basePrice,price])

  const getPatentDetails = async () => {
    let path = base_url + "public/patent/" + patentId
    await appContext.getAxios().get(path).then((response) => {
      if (response !== undefined && response.status === 200) {
        setPatentDetail(response.data)
        setOwner(response.data.user[0].name)
        setEtherScanToken(response.data.id)
        let len = response.data.bidLog.length
        if (len >=1){
          setBasePrice(response.data.bidLog[len-1].amount)
          setPrice(response.data.bidLog[len-1].amount)
        }
        else{
          setBasePrice(response.data.baseAmount)
          setPrice(response.data.baseAmount)
        }

        
        setTransferStatus(response.data.transferStatus)
        if (response.data.transferStatus === 1) {
          setReadyToSell(true)
        }
        if(response.data.approvedBuyer === localStorage.getItem("accountAddress")){
            setExpiryTime(response.data.payment_expiry_date)
            setInitial(true)
        }
      }
    }).catch(err => {
      console.log(err);
    })
  }
  const redirectEther = async () =>{
    let path = `https://goerli.etherscan.io/token/${goerliContractAddress}?a=`+etherScanToken
    window.open(path)
    
  }
  const onFormInputChange = (e) => {
    e.preventDefault();
    setPrice(e.target.value)
  }
  const makeAnOffer = async (e) => {
    setEnableButton(false)
    e.preventDefault()
    let path = base_url + "users/me/patents/bid/" + patentId;
    let body = {
      bidAmount: price
    }
    console.log(price);
    console.log(await getUserBalance());
    let bal = await getUserBalance()
    let cBal=bal/Math.pow(10,18);
    if(+price <= cBal){
      await appContext
      .getAxios()
      .patch(path, body)
      .then((response) => {
        if (response !== undefined && response.status === 200) {
          handleClose()
          toast.success(response.data.message);
        }
      })
      .catch((err) => {
        console.log(err);
      });
     }
    else{
    toast.warn("Insufficient Balance")
    }

   
  }
  const transferPayment =async()=>{
    setShowPaymentModal(true)
    let transferStatus = await buyPatent(patentId,price,appContext.getAxios)
    console.log(transferStatus);
    if (transferStatus===1 || transferStatus===0 ){
      let path =base_url+"users/me/patents/checkTransferTransactionStatus/"+patentId
      await appContext.getAxios().patch(path).then((res)=>{
        console.log(res);
        setShowPaymentModal(false)
        getPatentDetails()
      })
    }
  }
  const buyPatent = async (tokenId, amount, axios) => {
    return new Promise((resolve) => {
      setStepStatus(0)
      const web3Provider = new Web3(window.ethereum)
      const web3 = new Web3(web3Provider)
      const NFTContract = require('../contract-abi/NFT.json');
      const NFT = new web3.eth.Contract(NFTContract.abi, goerliContractAddress)

      if (window.ethereum) {
        window.ethereum
          .request({ method: "eth_requestAccounts" })
          .then((accounts) => {
            NFT.methods.buyNft("" + tokenId).send({ from: accounts[0], value: Web3.utils.toWei("" + amount, "ether") })
              .on('transactionHash', async function (hash) {
                let body = {
                  transactionHash: hash
                }
                setStepStatus(1)
                let path = base_url + "users/me/patents/transferPending/" + tokenId
                await axios().patch(path, body).then((res) => {
                  console.log(res);
                }).catch((error) => {
                  console.log(error);
                })
              })
              .then(() => {
                setStepStatus(2)
                console.log("buy patent success")
                resolve(1)
              }).catch((error) => {
                if (error.code) {
                  setShowPaymentModal(false)
                  resolve(-1)
                }
                console.log(error);
                resolve(0)
              })
          }).catch((error) => {
            console.log(error);
          })
      }
    })

  }

  return (
    <>

      <div className="container  ">
        <div className="panel">
          <div className="panel-heading">Patent Details </div>

          <div className="shadow p-3 mt-3  rounded">
            <div className="row">
              <div className="col-lg-6 col-12 p-3">
                <Border className="p-3">
                  <div className="list_items ">
                    <div className="row">
                      <div className="col-md-3 col-lg-4 font-weight-bold">Name</div>
                      <div className="col-md-9 col-lg-8">
                        <Break>
                          <span className="list_value">
                            {patentDetail.patentName}
                          </span>
                        </Break>
                      </div>
                    </div>
                  </div>
                </Border>
              </div>
              <div className="col-lg-6 col-12 p-3">
                <Border className="p-3">
                  <div className="list_items ">
                    <div className="row">
                      <div className="col-md-3 col-lg-4 font-weight-bold">Status</div>
                      <div className="col-md-9 col-lg-8">
                        <div className="row">
                          <div className="col-12 col-lg-4">
                          <Break>
                          <span className="list_value">
                            {getStatusName(patentDetail.status)}
                          </span>
                        </Break>
                          </div>
                          <div className="col-12 col-lg-8">
        
                          </div>
                        </div>
                        
                        
                        
                      </div>
                    </div>
                  </div>
                </Border>
              </div>

              
              <div className="col-lg-6  col-12 p-3">
                <Border className="p-3">
                  <div className="list_items ">
                    <div className="row">
                      <div className="col-md-3 col-lg-4 font-weight-bold">Owner</div>
                      <div className="col-md-9 col-lg-8">
                        <Break>
                          <span className="list_value">
                            {owner}
                          </span>
                        </Break>
                      </div>
                    </div>
                  </div>
                </Border>
              </div>
              <div className="col-lg-6 col-12 p-3">
                <Border className="p-3">
                  <div className="list_items ">
                    <div className="row">
                      <div className="col-md-3 col-lg-4 font-weight-bold">Applied On</div>
                      <div className="col-md-9 col-lg-8">
                        <Break>
                          <span className="list_value">
                            {Moment(patentDetail.createdAt).format('DD-MM-YYYY')}
                          </span>
                        </Break>
                      </div>
                    </div>
                  </div>
                </Border>
              </div>
              <div className=" col-12 p-3">
                <Border className="p-3">
                  <div className="list_items ">
                    <div className="row">
                      <div className="col-md-3 col-lg-2 font-weight-bold">Description</div>
                      <div className="col-md-9 col-lg-10 ">
                        <Break>
                          <span className="list_value">
                            {patentDetail.description}
                          </span>
                        </Break>
                      </div>
                    </div>
                  </div>
                </Border>
              </div>
            </div>
            <Border className="p-3">
            <div className="buttons p-3">
              <div className="button-container">
  
              <button type="button" className=" etherButton " onClick={redirectEther} style={{height:"50px",width:"250px"}} >
                              <span className="view p-2"> View on Etherscan</span>
                              <span className="p-2" style={{textAlign:"end"}}> 
                            <img
                    src={require("./images/etherscan_logo.png")}
                    style={{ width: "25px", height: "25px" }}
                    alt=""
                    width="32"
                    height="32"
                    className="rounded-circle me-2"
                  />
                  </span>
                            </button>
              </div>
              { readyToSell && transferStatus === 1  && publicAddress !== patentDetail.publicAddress && <div className=" button-container">
                   <button type="button" onClick={handleShow} style={{ height: "50px", width: "250px" }} className=" etherButton">Make an offer
                    <span className="p-2" style={{ textAlign: "end" }}>
                      <i className="fa-solid fa-hand-holding-dollar"></i>
                    </span>
                  </button>
                  

                </div>}
                {transferStatus ===2  && diffTime >0 &&  publicAddress === patentDetail.approvedBuyer && <div className=" button-container">
                   <button type="button" onClick={transferPayment} style={{ height: "50px", width: "250px" }} className=" etherButton">Make Payment
                    <span className="p-2" style={{ textAlign: "end" }}>
                      <i className="fa-solid fa-hand-holding-dollar"></i>
                    </span>
                  </button>
                  

                </div>}
                {transferStatus ===4  && diffTime >0 && <div className=" button-container">
                   <button type="button" onClick={transferPayment} style={{ height: "50px", width: "250px" }} className=" etherButton">Retry Payment
                    <span className="p-2" style={{ textAlign: "end" }}>
                      <i className="fa-solid fa-hand-holding-dollar"></i>
                    </span>
                  </button>
                  

                </div>}
                {transferStatus ===3 && <div className=" button-container" style={{alignSelf:'center',fontWeight:'bold'}}>
                   Payment In-progress
                  

                </div>}

            </div>
          </Border>

          {patentDetail.approvedBuyer && diffTime >0 && (transferStatus ===2 || transferStatus ===4) && <div className="row">
              <div className="buttons p-3">
                <div className="button-container">
                  <div className="show-counter">
                    {diffTime >= 0 &&<div className="countdown-link">
                      <div className={`countdown ${countdownTime.countdownDays<2?"text-danger":''}`}>
                        <p>{countdownTime.countdownDays}</p>
                        <span>Days</span>
                      </div>
                      <p>:</p>

                      <div className={`countdown ${countdownTime.countdownDays ===0 && countdownTime.countdownHours<24?"text-danger":''}`}>
                        <p>{countdownTime.countdownHours}</p>
                        <span>Hours</span>
                      </div>
                      <p>:</p>
                      <div className={`countdown ${countdownTime.countdownDays ===0 && countdownTime.countdownHours<1?"text-danger":''}`}>
                        <p>{countdownTime.countdownMinutes}</p>
                        <span>Minutes</span>
                      </div>
                      <p>:</p>
                      <div className={`countdown ${countdownTime.countdownDays ===0 && countdownTime.countdownHours<1 && countdownTime.countdownMinutes <3?"text-danger":''}`}>
                        <p>{countdownTime.countdownSeconds}</p>
                        <span>Seconds</span>
                      </div>
                    </div>}
                  </div>
                  {diffTime >= 0 &&<div className="text-center">
                    Payment Remaining Time
                    </div> }
                </div>
              </div>
            </div>}

          </div>
          <div className="shadow p-3 mt-3  rounded">
            <Table responsive>
              <thead>
                <tr>
                  <th style={{ width: "2%" }}>Sl.no</th>
                  <th>File</th>
                </tr>
              </thead>
              <tbody>
                {patentDetail.s3Address ?
                  patentDetail.s3Address.map((result, index) => {
                    return <tr style={{
                      borderColor: "inherit",
                      borderStyle: "solid",
                      borderWidth: "thin",
                    }} key={index}>
                      <td style={{ width: "25%" }}>{index + 1}</td>
                      <td>
                        <a href={aws_url + result} rel="noopener noreferrer"
                          target="_blank"
                          download>
                          <Break>{result}</Break>
                        </a>
                      </td>
                    </tr>

                  }) : <tr><td
                    className="text-center border-cstm-btm" colSpan={2}>
                    No Data
                  </td>
                  </tr>}
              </tbody>
            </Table>
          </div>

        </div>
        <Modal size='md' centered show={show} onHide={handleClose} className={localStorage.getItem("theme") === "dark" ? "dark" : ""} backdrop="static">
        <Modal.Header >
          <Modal.Title><h4>Make an offer</h4></Modal.Title>
          <button type="button" onClick={handleClose} className="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </Modal.Header>
        <Modal.Body>
          <>
            <div className="container">
              <form className='makeoffer'>
                <div className="row top-wrap">
                  <div className="col-12">
                    <div className="row mb-5">
                      <div className="col-4 label">
                        <label htmlFor="mail">Price (in ETH)</label>
                      </div>
                        <div className="col-8">
                          <input className="form-control" type="number" value={price} step={stepValue} name="patentName" placeholder="ETH" maxLength="10" min={basePrice} max="999999" autoComplete="off" onChange={e => onFormInputChange(e)} />

                        </div>
                    </div>
                    <div className="row mb-5">
                      <div className="col-4 ">
                        <label htmlFor="mail">Base Price</label>
                      </div>
                        <div className="col-8 font-weight-bold">
                         {basePrice} ETH

                        </div>
                    </div>
                  </div>
                </div>
                <div className="mt-1 mb-4" style={{ "float": "right" }}>
                  <Button disabled={!enableButton} variant="primary" style={{ backgroundColor: '#144399' }} className="mr-3" onClick={e=>makeAnOffer(e)}>Make Offer</Button>
                </div>
              </form>
            </div>
          </>
        </Modal.Body>
      </Modal>
      </div>
      {showPaymentModal && <PaymentModal show={showPaymentModal} status={stepStatus}/>}
    </>
  );
}