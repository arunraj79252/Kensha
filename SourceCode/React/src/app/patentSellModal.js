import React, { useEffect, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import useAppContext from "../AppContext";
import { toast } from "react-toastify";
import Spinner from 'react-bootstrap/Spinner';
import PaymentModal from "./paymentModal";
import Web3 from 'web3';
const { goerliContractAddress } = require('../contract-abi/ethereumConfig');
const PatentSellModal = (props) => {
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const appContext = useAppContext();
  const [price, setPrice] = useState(0.001)
  const [enableButton,setEnableButton] = useState(false)
  const [loading,setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [stepStatus, setStepStatus] = useState(0);
  const handleClose = () => {
    props.close()
  }
  useEffect(()=>{
    if (price > 0) {
      setEnableButton(true)
    }
    else{
      setEnableButton(false)
    }
  },[price])
  const inputChange = (event) => {
    setPrice(event.target.value)
  }
  const sellConfirmation = (e) => {
    e.preventDefault()
    console.log(price);
  }
  const onReadyToSell = async () => {
    setEnableButton(false)
    setStepStatus(0)
    let path = base_url + "users/me/patents/readyForSale/" + props.patentId;
    let body = {
      baseAmount: price
    }
    setLoading(true)
    setShowPaymentModal(true)
    let patenSale =await listPatentForSale(props.patentId)
    if (patenSale ===1) {
      await appContext
      .getAxios()
      .patch(path, body)
      .then((response) => {
        setStepStatus(2)
        if (response !== undefined && response.status === 200) {
          toast.success(response.data.message);
          props.selStatusChange(true);
          props.close()
        }
      })
      .catch((err) => {
        setEnableButton(true)
        setLoading(false)
        setShowPaymentModal(false)
        console.log(err);
      });
    }
    else{
      setEnableButton(true)
      setLoading(false)
      setShowPaymentModal(false)
    }
    
  }

  const listPatentForSale = async (tokenId) => {
    return new Promise((resolve) => {
      const web3Provider = new Web3(window.ethereum)
      const web3 = new Web3(web3Provider)
      const NFTContract = require('../contract-abi/NFT.json');
      const NFT = new web3.eth.Contract(NFTContract.abi, goerliContractAddress)
      if (window.ethereum) {
        window.ethereum
          .request({ method: "eth_requestAccounts" })
          .then((accounts) => {
            NFT.methods.giveApprovalToContract(tokenId).send({ from: accounts[0] }).on('transactionHash', async function (hash) {
              setStepStatus(1);
            })
              .then(() => {
                setStepStatus(2);
                console.log("approve success");
                resolve(1)
              }).catch((error) => {
                console.log(error, "err");
                resolve(0)
              })
          }).catch((error) => {
            resolve(-1)
          })

      }
    })

  }
  return (
    <>
     
    <Modal  dialogClassName="offer-modal" show={props.show} className={localStorage.getItem("theme") === "dark" ? "dark" : ""} onHide={handleClose} backdrop="static">
      <Modal.Header >
        <Modal.Title><h3>Sell Confirmation</h3></Modal.Title>
        <button type="button" onClick={handleClose} className="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </Modal.Header>
      <Modal.Body>
        <div className="container">
          
          <form onSubmit={e => sellConfirmation(e)} className='makeoffer'>
            <div className="row top-wrap">
              <div className="col-12">
                <div className="row mb-5">
                  <div className="col-3 label">
                    <label htmlFor="mail">Price (ETH)</label>
                  </div>
                  <div className="col-9">
                    <input className="form-control" type="number" onChange={e => inputChange(e)} value={price} step="0.001" name="patentName" placeholder="Price" max="1000000" autoComplete="off" />

                  </div>
                  <div className="col-3 mt-2"></div>
                  <div className="col-9 mt-2">
                  {loading && <span><Spinner className="small-spinner" animation="border" variant="primary" role="status" ></Spinner> Payment in-progress</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1 mb-2" style={{ "float": "right" }}>
              <Button variant="primary" disabled={!enableButton} style={{ backgroundColor: '#144399' }} className="mr-3" type="submit" onClick={onReadyToSell}>Submit</Button>
            </div>
          </form>
        </div>
      </Modal.Body>
     
    </Modal>
    {showPaymentModal && <PaymentModal show={showPaymentModal} status={stepStatus}/>}
    </>
  )
}

export default PatentSellModal