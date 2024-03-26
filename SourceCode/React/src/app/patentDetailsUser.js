import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Table from "react-bootstrap/Table";
import { useParams } from "react-router-dom";
import useAppContext from "../AppContext";
import PatentModal from "./patentList/patentModal";
import Moment from 'moment';
import getStatusName from "../app/Status";
import { toast } from "react-toastify";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import PatentSellModal from "./patentSellModal";
import {getPatentFees, getUserBalance } from "./blockchain-util"
import BidLogModal from "./bidLogModal";
import Spinner from 'react-bootstrap/Spinner';
import PaymentModal from "./paymentModal";
import Web3 from 'web3';
const { goerliNode, goerliContractAddress } = require('../contract-abi/ethereumConfig');

const Space = styled.div`
  display: flex;
  justify-content: space-between;
`;
const Pointer = styled.div`
  cursor: pointer;
`;
const Border = styled.div`
  /* border-bottom: solid 1px; */
  border-top: solid 1px;
`;
const Name = styled.div`
  font-weight: bold;
  overflow: overlay;
`;
const Date = styled.div`
  font-style: italic;
  font-size: 0.9rem;
  opacity: 0.8;
`;
const Break = styled.span`
  word-break: break-word;
`;
const PatentDetailsUser = () => {
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const appContext = useAppContext();
  const [patentDetail, setPatentDetail] = useState([]);
  const [show, setShow] = useState(false);
  const [comment, setComment] = useState();
  const patentId = useParams();
  const [etherScanToken, setEtherScanToken] = useState('')
  const [nameLengthError, setNameLengthError] = useState(false)
  const [showPopUp, setShowPopUp] = useState(false)
  const [readyToSell, setReadyToSell] = useState(false);
  const [showBidLogs, setShowBidLogs] = useState(false)
  const [expiryTime, setExpiryTime] = useState("");
  const [diffTime,setDiffTime] = useState(-1)
  const [initial,setInitial] = useState(false)
  const [countdownTime, setCountdownTime] = useState({
    countdownDays: "",
    countdownHours: "",
    countdownMinutes: "",
    countdownSeconds: "",
  });
  

  const [loading,setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [stepStatus, setStepStatus] = useState(0);
  useEffect(() => {
    getPatentDetails();
    return() =>{
      setInitial(false)
    }
    // console.log(new window.Date(date.getTime()-(date.getTimezoneOffset() * 60000)).toISOString());
  }, []);


  useEffect(() => {
    if (patentDetail.approvedBuyer) {
      

      const timeInterval = setInterval(() => {

        const currentTime = new window.Date().getTime();
        const countdownDateTime = new window.Date(expiryTime).getTime();
        const remainingDayTime = countdownDateTime - currentTime;
        
        // debugger;
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
          // console.log(runningCountdownTime);
  
  
  
  
          setCountdownTime(runningCountdownTime);
          // console.log(runningCountdownTime);
  
          if (remainingDayTime < 0) {
            console.log("done");
            clearInterval(timeInterval);
            setExpiryTime(false);
            getPatentDetails()
          }
        }
  
  
      }, 1000);
      return() =>{
        clearInterval(timeInterval);
        setInitial(false)
      }

    }
    


  },[initial])

  const getPatentDetails = async () => {
    let path = base_url + "users/me/patents/" + patentId.id;
    await appContext
      .getAxios()
      .get(path)
      .then((response) => {
        if (response !== undefined && response.status === 200) {
          setPatentDetail(response.data);
          if (response.data.status === 4) {
            setEtherScanToken(response.data.id)
          }
          if (response.data.status ===7) {
            checkPaymentStatus(response.data.feesTxHash)
          }
          if (response.data.transferStatus === 1) {
            setReadyToSell(true)
          }else{
            setReadyToSell(false)
          }
          if (response.data.transferStatus === 2) {
            setExpiryTime(response.data.payment_expiry_date)
            setInitial(true)
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const checkPaymentStatus = async (hash) => {
    let path = base_url + "users/me/patents/checkFeePaymentStatus/" + patentId.id
    await appContext.getAxios().patch(path).then((res) => {
      console.log(res);
    })
  }
  const patentEdit = () => {
    setShow(true);
  };
  const patentEditClose = () => {

    setShow(false);
    getPatentDetails()
  };
  const patentReadyClose = () => {
    setShowPopUp(false)
    setLoading(false)
    getPatentDetails()
  }
  const redirectEther = async () => {
    let path = `https://goerli.etherscan.io/token/${goerliContractAddress}?a=`+etherScanToken
    window.open(path)

  }

  const bidLogClose = () => {
    setShowBidLogs(false);
    getPatentDetails()
  };
  const sendMessage = async (event, key) => {
    if ((event.charCode === 13 && !event.shiftKey) || key) {
      event.preventDefault()

      const path = base_url + "users/me/patents/comment/" + patentId.id;
      let commentText = comment ? comment.trim() : comment
      if (!commentText) {
        toast.warning("Please enter comment to proceed");
        return
      }
      const body = {
        message: commentText
      }
      await appContext.getAxios().post(path, body).then((response) => {
        setComment("")
        setNameLengthError(false)
        getPatentDetails().then(() => {
          setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
          }, 100);
        })
      })
        .catch((err) => {
          console.log(err);
        });
    }
  }
  const onInputChange = (e) => {
    e.preventDefault();
    setComment(e.target.value)
    if (e.target.value.length >= 1000) {
      setNameLengthError(true)
    } else {
      setNameLengthError(false)
    }
  }
  const onreadyToSell = () => {
    setShowPopUp(true)
    onSellStatusChange(false)
  }
  const bidStatus = () => {
    setShowBidLogs(true)
  }
  const onSellStatusChange = (status) => {
    setReadyToSell(status)
  }
  const makePayment = async () => {
    let balance = await getUserBalance()
    console.log(balance);
    if (balance > 10000) {
      setLoading(true)
      setShowPaymentModal(true)
      let paymentStatus = await payPatentFees(patentId.id, appContext.getAxios)
      if (paymentStatus === 0) {
        let path = base_url + "users/me/patents/paymentFailed/" + patentId.id
        await appContext.getAxios().patch(path).then(() => {
          setTimeout(() => {
            getPatentDetails()
          }, 1000);
        })

      }
      else if (paymentStatus === -1) {
        setLoading(false)
        setShowPaymentModal(false)
        return
      }
      else {
        console.log(paymentStatus);
        // checkPaymentStatus()
        let path = base_url + "users/me/patents/checkFeePaymentStatus/" + patentId.id
        await appContext.getAxios().patch(path).then((res) => {
          setStepStatus(3)
          console.log(res);
          setTimeout(() => {
            getPatentDetails()
          }, 1000);
        })
      }

    }
    else {
      toast.warn("Insufficient balance")
    }

    setLoading(false)
    setShowPaymentModal(false)
  }
  const readyToSellSpionner = () => {
    setLoading(true)
  }

  const payPatentFees = async (tokenId, axios) => {
    const fee= await getPatentFees();
    return new Promise((resolve) => {
        const web3Provider = new Web3(window.ethereum)
        console.log(goerliNode);
        const web3 = new Web3(web3Provider)
        const NFTContract = require('../contract-abi/NFT.json');
        console.log(NFTContract);
        const NFT = new web3.eth.Contract(NFTContract.abi, goerliContractAddress)
        
        if (window.ethereum) {
            window.ethereum
                .request({ method: "eth_requestAccounts" })
                .then((accounts) => {
                    NFT.methods.payPatentFees(tokenId).send({ from: accounts[0], value: fee })
                        .on('transactionHash', async function (hash) {
                            let body = {
                                transactionHash: hash
                            }
                            setStepStatus(1)
                            let path = base_url + "users/me/patents/paymentPending/" + tokenId
                            await axios().patch(path, body).then((res) => {
                                console.log(res);
                            }).catch((error) => {
                                console.log(error);

                            })
                        }).then((data) => {
                          setStepStatus(2)
                            console.log("pay patent fees success")
                            console.log(data);
                            resolve(data)
                        }).catch((error) => {
                            if (error.code) {
                                resolve(-1)
                            }
                            resolve(0)
                        })

                }).catch((error)=>{
                    console.log(error);
                })
        }
    })

}

  return (
    <>
      {loading && <span className="spinner-name">Payment in-progress <br /> <Spinner className="statusspinner" animation="border" variant="primary" role="status" >
      </Spinner></span>}
      <div className="container" disabled={loading}>
        <div className="panel commentPanel">
          <Space className="panel-heading">
            Patent Details
            {patentDetail.status === 3 || patentDetail.status === 0 || patentDetail.status === 5 ? <Pointer>
              <i onClick={patentEdit} className="fa-solid fa-pen"></i>
            </Pointer> : ""}
          </Space>

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
                          <div className="col-lg-5 col-12">
                            <Break>
                              <span className={`list_value ${patentDetail.status === 3 ? 'text-danger font-weight-bold' : ''}`}>
                                {getStatusName(patentDetail.status)}
                              </span>
                            </Break>
                          </div>
                          <div className="col-lg-7 col-12">

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Border>
              </div>
              <div className=" col-12 p-3">
                <Border className="p-3">
                  <div className="list_items ">
                    <div className="row">
                      <div className="col-md-3 col-lg-2 font-weight-bold">Applied On</div>
                      <div className="col-md-9 col-lg-10">
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
                      <div className="col-md-9 col-lg-10">
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

            {patentDetail.transferStatus === 2 && <div className="row">
              <div className="col-lg-6 col-12 p-3">
                <Border className="p-3">
                  <div className="list_items ">
                    <div className="row">
                      <div className="col-md-3 col-lg-4 font-weight-bold">Approved Buyer</div>
                      <div className="col-md-9 col-lg-8">
                        <Break>
                          <span className="list_value">
                            {patentDetail.buyerName}  ({patentDetail.approvedBuyer})
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
                      <div className="col-md-3 col-lg-4 font-weight-bold">Approved Price</div>
                      <div className="col-md-9 col-lg-8">
                        <div className="row">
                          <div className="col-lg-5 col-12">
                            <Break>
                              <span className="list_value">
                                {patentDetail.approvedPrice}
                              </span>
                            </Break>
                          </div>
                          <div className="col-lg-7 col-12">

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Border>
              </div>



            </div>}

            {patentDetail.status === 4 ? <Border className="p-3">
              <div className="buttons p-3">
                <div className="button-container">
                  <button type="button" className=" etherButton" onClick={redirectEther} style={{ height: "50px", width: "250px" }} >
                    <span className="view p-2"> View on Etherscan</span>
                    <span className="p-2" style={{ textAlign: "end" }}>
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
                {(patentDetail.transferStatus === 1 || patentDetail.transferStatus === 0) && <div className="button-container">
                  {!readyToSell && patentDetail.transferStatus === 0 && <button type="button" onClick={onreadyToSell} style={{ height: "50px", width: "250px" }} className=" etherButton"><span className="p-2">Ready to Sell
                  </span>
                    <span className="p-2" style={{ textAlign: "end" }}>
                      <i className="fa-solid fa-hand-holding-dollar"></i>
                    </span>
                  </button>}
                  {patentDetail.transferStatus === 1 && <button type="button" onClick={bidStatus} style={{ height: "50px", width: "250px" }} className=" etherButton"><span className="p-2">Bid status</span>
                    <span className="p-2" style={{ textAlign: "end" }}>
                      <i className="fa-solid fa-gavel"></i>
                    </span>
                  </button>}
                </div>}

              </div>
            </Border> : ''}
            {patentDetail.status === 6  ? <Border className="p-3">
              <div className="buttons p-3">
                <div className="button-container">
                  <button type="button" className=" etherButton" onClick={makePayment} style={{ height: "50px", width: "250px" }} >
                    <span className="view p-2"> Make Payment</span>
                    <span className="p-2" style={{ textAlign: "end" }}>
                      {/* <img
                    src={require("./images/etherscan_logo.png")}
                    style={{ width: "25px", height: "25px" }}
                    alt=""
                    width="32"
                    height="32"
                    className="rounded-circle me-2"
                  /> */}
                    </span>
                  </button>
                </div>

              </div>
            </Border> : ''}
            {patentDetail.status === 8   ? <Border className="p-3">
              <div className="buttons p-3">
                <div className="button-container">
                  <button type="button" className=" etherButton" onClick={makePayment} style={{ height: "50px", width: "250px" }} >
                    <span className="view p-2"> Retry Payment</span>
                    <span className="p-2" style={{ textAlign: "end" }}>
                      {/* <img
                    src={require("./images/etherscan_logo.png")}
                    style={{ width: "25px", height: "25px" }}
                    alt=""
                    width="32"
                    height="32"
                    className="rounded-circle me-2"
                  /> */}
                    </span>
                  </button>
                </div>

              </div>
            </Border> : ''}
            {patentDetail.approvedBuyer && <div className="row">
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
                  <th style={{ width: "25%" }}>Sl.no</th>
                  <th>File</th>
                </tr>
              </thead>
              <tbody>
                {patentDetail.s3Address ?
                  patentDetail.s3Address.map((result, index) => {
                    return (
                      <tr
                        style={{
                          borderColor: "inherit",
                          borderStyle: "solid",
                          borderWidth: "thin",
                        }} key={index}
                      >
                        <td style={{ width: "25%" }}>{index + 1}</td>
                        <td>
                          <a
                            href={
                              aws_url +
                              result
                            }
                            target="_blank" rel="noopener noreferrer"
                            download
                          >
                            <Break>{result}</Break>
                          </a>
                        </td>
                      </tr>
                    );
                  }) : <tr><td
                    className="text-center border-cstm-btm" colSpan={2}>
                    No Data
                  </td>
                  </tr>}
              </tbody>
            </Table>
          </div>
          <div className="shadow p-3 mt-3   rounded">
            <h5 className="mb-3">Comments</h5>
            {patentDetail.message ?
              patentDetail.message.map((message, index) => {
                return (
                  <Border key={index}>
                    <div className="row my-3">
                      <div className="col-12 mb-1">
                        {" "}
                        <Name>{message.user}</Name>{" "}
                      </div>
                      <div className="col-12 mb-3">
                        <Date>{Moment(message.statusDate).format('DD-MM-YYYY HH:mm:ss')}</Date>
                      </div>
                      <div className="col-12 mb-1 wordbreak">
                        {" "}
                        {message.message.split('\n').map((str, i) => <span key={i}>{str}<br /></span>)}
                      </div>
                    </div>
                  </Border>
                );
              }) : ''}
          </div>
        </div>
      </div>
      <div className="shadow p-3   rounded  commentSection " disabled={loading}>
        <form >
          <div className="form-group">
            <div className="row px-4">
              <div className="col-11">
                <OverlayTrigger
                  placement="top" show={nameLengthError}
                  overlay={
                    <Popover style={{ width: "30%" }}>
                      <Popover.Header as="h3"><strong></strong> Maximum limit exceeded</Popover.Header>
                    </Popover>
                  }
                >

                  <textarea value={comment} name="comment" onChange={(e) => onInputChange(e)}
                    // onKeyDown
                    onKeyPress={(e) => sendMessage(e, 0)}
                    type="text"
                    rows="1"
                    autoComplete="off"
                    className={`commenttext form-control`}
                    placeholder="Write a comment"
                    maxLength={1000}
                  />
                </OverlayTrigger>
              </div>
              <div className="col-1 comment-col">
                <span onClick={(e) => sendMessage(e, 1)} style={{ cursor: "pointer" }}>
                  <i
                    className="fas fa-paper-plane"
                    style={{ lineHeight: 2, color: "#144399" }}
                  ></i>
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
      {show ? <PatentModal show={show} patentDetail={patentDetail} close={patentEditClose} /> : ''}
      {showPopUp ? <PatentSellModal show={showPopUp} patentId={patentId.id} readyToSell={readyToSell} selStatusChange={onSellStatusChange} setSpinner={readyToSellSpionner} close={patentReadyClose} /> : ''}
      {showBidLogs ? <BidLogModal userType={1} show={showBidLogs} patentDetail={patentDetail} close={bidLogClose} /> : ''}
      {showPaymentModal && <PaymentModal show={showPaymentModal} status={stepStatus}/>}

    </>
  );
};

export default PatentDetailsUser;
