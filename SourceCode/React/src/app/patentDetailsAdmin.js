import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Table from 'react-bootstrap/Table';
import useAppContext from "../AppContext";
import styled from "styled-components";
import Moment from 'moment';
import { toast } from "react-toastify";
import { Modal } from "react-bootstrap";
import getStatusName from "../app/Status";
import Spinner from 'react-bootstrap/Spinner';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import BidLogModal from "./bidLogModal";
const { goerliContractAddress } = require('../contract-abi/ethereumConfig');
const Border = styled.div`
  /* border-bottom: solid 1px; */
  border-top: solid 1px;
`;
const Break = styled.span`
  word-break: break-word;
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
const Spacing = styled.div`
  display: flex;
  justify-content: end;
`
export default function PatentDetailsAdmin() {
  const appContext = useAppContext();
  const [show, setShow] = useState(false)
  const [reason, setReason] = useState()
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const aws_url = process.env.REACT_APP_AWS_ENDPOINT;
  const [owner, setOwner] = useState()
  const [patentDetail, setPatentDetail] = useState([]);
  const params = useParams()
  let patentId = params.id;
  const [patentStatus, setPatentStatus] = useState(1);
  const [comment, setComment] = useState('');
  const [enableButton, setEnableButton] = useState(false)
  const [loading, setLoading] = useState(false)
  const [etherScanToken, setEtherScanToken] = useState('');
  const [nameLengthError, setNameLengthError] = useState(false)
  const [showBidLogs,setShowBidLogs] = useState(false)
  const statusArray = [
    { id: 1, name: "Review" },
    { id: 6, name: "Ready for payment"},
    { id: 3, name: "Reject" }
  ]
  const readyForPayment =[
    {id:6, name:"Ready for payment"}
  ]
  const applyStatusArray = [
    { id: 0, name: "Applied" },
    { id: 1, name: "Review" },
  ]
  const rejectStatus = [

    { id: 1, name: "Review" },
    { id: 3, name: "Reject" }
  ]
  const approveStatus = [
    { id: 2, name: "Approve" }
  ]
  const resubmitStatus = [
    { id: 5, name: "Resubmitted" },
    { id: 1, name: "Review" }
  ]

  useEffect(() => {

    getPatentDetails();
  }, []);

  // useEffect(() => {
  //   if (nameLengthError) {
  //     setTimeout(() => {
  //       setNameLengthError("")
  //     }, 1000);
  //   }
  // }, [nameLengthError]);



  const getPatentDetails = async () => {
    let path = base_url + "admin/patents/" + patentId
    await appContext.getAxios().get(path).then((response) => {
      if (response !== undefined && response.status === 200) {
        setPatentDetail(response.data)
        setOwner(response.data.user[0].name)
        setPatentStatus(response.data.status)
        if (response.data.status === 4) {
          setEtherScanToken(response.data.id)
        }
      }
    }).catch(err => {
      console.log(err);
    })
  }

  const sendMessage = async (event, key) => {
    if ((event.charCode === 13 && !event.shiftKey) || key) {
      event.preventDefault()
      const path = base_url + "admin/patents/comment/" + patentId;

      let commentText = comment ? comment.trim() : comment
      if (!commentText) {
        toast.warning("Please enter comment to proceed");
        return
      }
      else if(comment.length>=1000){
        return
      }
      const body = {
        message: comment
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
      return
    } else {
      setNameLengthError(false)
    }
  }
  const reasonChange = (e) => {
    e.preventDefault()
    if (e.target.value) {
      setEnableButton(true)
    }
    else {
      setEnableButton(false)
    }
    setReason(e.target.value)
  }

  const statusChange = (e) => {
    setPatentStatus(e.target.value)
    if (+e.target.value === 3) {
      setShow(true)
    } else {
      updateStatus(+e.target.value)
    }


  }
  const redirectEther = async () => {
    let path = `https://goerli.etherscan.io/token/${goerliContractAddress}?a=`+etherScanToken
    window.open(path)

  }
  const reasonSubmit = async (e) => {
    setLoading(true)
    e.preventDefault()

    let path = base_url + "admin/patents/reject/" + patentDetail.id;
    let body = {
      "message": reason
    }
    await appContext.getAxios().patch(path, body).then((response) => {
      if (response !== undefined && response.status === 200) {
        toast.success("status changed")
        setLoading(false)
        getPatentDetails();
        setShow(false)
      }
    }).catch(err => {
      console.log(err);
    })
  }
  const updateStatus = async (newstatus) => {
    setLoading(true)
    let apiPath = ""
    if (newstatus === 1) {
      apiPath = "admin/patents/review/";
    }
    else if (newstatus === 2) {
      apiPath = "admin/patents/approve/";
    }
    else if (newstatus === 6) {
      apiPath = "admin/patents/readyToApprove/";
    }

    let path = base_url + apiPath + patentDetail.id;
    await appContext.getAxios().patch(path).then((response) => {
      if (response !== undefined && response.status === 200) {
        toast.success("status changed")
        setLoading(false)
        getPatentDetails();
      }
    }).catch(err => {
      console.log(err);
    })
  }

  const handleClose = () => {
    setShow(false)
    setReason('')
    getPatentDetails()
  }
  const bidStatus =() =>{
    setShowBidLogs(true)
  }
  const bidLogClose = () => {
    setShowBidLogs(false);
    getPatentDetails()
  };
  return (
    <>
      {loading ? <Spinner animation="border" variant="primary" role="status" className="statusspinner">
      </Spinner> : ""}
      <div disabled={loading}>
        <div className="container">
          <div className="panel commentPanel">
            <div className="panel-heading ">Patent Details</div>
            <div className="row ">
              <div className="col-lg-10"></div>
              <div className="col-lg-2 pt-3  ">

                {patentStatus !== 4 && patentStatus !== 2 && patentStatus !== 7 && patentStatus !== 8 && patentStatus !== 6 && patentStatus !== 9 ? <select className="caret" onChange={e => { statusChange(e) }} value={patentStatus}>
                  {patentStatus === 0 ?
                    applyStatusArray.map((status) => {

                      if (status.id === 0) {
                        return <option value={status.id} hidden key={status.id}>{status.name}</option>
                      }
                      else {
                        return <option value={status.id} key={status.id}>{status.name}</option>
                      }


                    }) : patentStatus === 1 ?

                      statusArray.map((status) => {

                        if (status.id === 1) {
                          return <option value={status.id} hidden key={status.id}>{status.name}</option>
                        }
                        else {
                          return <option value={status.id} key={status.id}>{status.name}</option>
                        }


                      }) : patentStatus === 2 ?
                        approveStatus.map((status) => {
                          return <option value={status.id} key={status.id}>{status.name}</option>
                        }) : patentStatus === 3 ?
                          rejectStatus.map((status) => {
                            return <option value={status.id} key={status.id}>{status.name}</option>
                          }) : patentStatus === 5 ? resubmitStatus.map((status) => {
                            return <option value={status.id} key={status.id}>{status.name}</option>
                          }) :patentStatus === 6 ? readyForPayment.map((status) => {
                            return <option value={status.id} key={status.id}>{status.name}</option>
                          }):''

                  }

                </select> : ''}

              </div>
            </div>

            <div className="shadow p-3 mt-3  rounded">
              <div className="row">
                <div className="col-lg-6 col-12 p-3">
                  <Border className="p-3">
                    <div className="list_items ">
                      <div className="row">
                        <div className="col-md-3 col-lg-4 font-weight-bold">Name</div>
                        <div className="col-md-9 col-lg-8">
                          <Break>
                            <span className="list_value ">
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
                                <span className={`list_value ${patentDetail.status === 3 ? 'text-danger font-weight-bold' : ''}`}>
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
             {etherScanToken? <Border className="p-3">
            <div className="buttons p-3">
              <div className="button-container">
             <button type="button" className=" etherButton" onClick={redirectEther} style={{height:"50px",width:"250px"}} >
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
              {patentDetail.transferStatus ===1 &&<div className="button-container">
            
              <button type="button" onClick={bidStatus} style={{height:"50px",width:"250px"}} className=" etherButton"><span className="p-2">Bid status</span>
              <span className="p-2" style={{textAlign:"end"}}>
              <i className="fa-solid fa-gavel"></i>
              </span>
              </button>
              </div>}

            </div>
          </Border>:''}
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
            <div className="shadow p-3 mt-3  rounded">
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
        <div className="shadow p-3 mt-3   rounded commentSection">
          <form >
            <div className="form-group">
              <div className="row px-4">
                {/* <div className="col-2"></div> */}
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

                  <span onClick={(e) => sendMessage(e, 1)} style={{ "cursor": "pointer" }}>
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
      </div>
      <Modal dialogClassName="my-modal" show={show} className={localStorage.getItem("theme") === "dark" ? "dark" : ""} onHide={handleClose} backdrop="static">
        <Modal.Header >
          <Modal.Title><h3>Reject Patent</h3></Modal.Title>
          <button type="button" onClick={handleClose} className="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={e => reasonSubmit(e)}>
            <div className="form-group purple-border">
              <label >Enter Reject reason</label>
              <textarea className="form-control" id="exampleFormControlTextarea4" value={reason} rows="3" onChange={e => reasonChange(e)}></textarea>
            </div>
            <Spacing>
              <input type="button" value="cancel" onClick={handleClose} className="btn btn-secondary p-2 m-2" />
              <input type="submit" style={{ backgroundColor: '#144399' }} value="submit" disabled={!enableButton} className={`m-2 btn btn-primary p-2  ${!enableButton ? 'disableButton' : ''}`} />
            </Spacing>
          </form>
        </Modal.Body>
      </Modal>
      {showBidLogs ? <BidLogModal userType={2} show={showBidLogs} patentDetail={patentDetail} close={bidLogClose} /> : ''}

    </>
  );
}