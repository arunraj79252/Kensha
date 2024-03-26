import React, { useEffect, useRef, useState } from "react";
import useAppContext from "../../AppContext";
import Modal from "react-bootstrap/Modal";
import Spinner from 'react-bootstrap/Spinner'
import { Button } from "react-bootstrap";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import styled from "styled-components";

const Cursor = styled.div`
  cursor: pointer;
`
const PatentModal = (props) => {
  const appContext = useAppContext();

  useEffect(() => {
    setPatentDetail(props.patentDetail);
  }, [props.patentDetail]);

  const [patentDetail, setPatentDetail] = useState(props.patentDetail);
  const arrayCheck = useRef()
  const [enableButton,setEnableButton] = useState(true)
  const [nameError, setNameError] = useState('')
  const [descError, setDescError] = useState('')
  const [nameLengthError, setNameLengthError] = useState('')
  const [descLengthError, setDescLengthError] = useState('')
  const [uploadStatus, setUploadStatus] = useState([])
  const [fileNameArray, setFileNameArray] = useState([])
  const [fileArray, setFileArray] = useState([])
  const [existingFile,setExistingFile] =useState(props.patentDetail.s3Address)
  const [uploadPathFiles, setUploadPathFiles] = useState(props.patentDetail.s3Address)
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const patentId = useParams();
  let uploadedFiles = [];
  const handleClose = () => {
    props.close(false);
  };
  useEffect(()=>{
    
    let a=[]
    props.patentDetail.s3Address.forEach(element => {
      a.push({"name":element,status:1})
    });
    setFileNameArray((prevState)=>[...prevState,...a])
    
  },[])

  useEffect(()=>{

    if (uploadPathFiles.length>=1) {
      if ((nameError ==="" && patentDetail.patentName) && (descError ==="" && patentDetail.description) && (fileArray.length+fileNameArray.length) === uploadPathFiles.length ) {

        setEnableButton(false)
      }
      else{
        setEnableButton(true)
      }  
    }
    else{
      setEnableButton(true)
    }
    
  },[uploadPathFiles,nameError,patentDetail,descError])

  useEffect(()=>{
    
    let filledArray = new Array(fileArray.length).fill(0);
    setUploadPathFiles(existingFile)
    arrayCheck.current=filledArray
    setUploadStatus(arrayCheck.current)
    
      fileArray.forEach((file, index) => {
      fileUpload(file, index).then(
        resp=>{

          
          arrayCheck.current[index] = 1
          setUploadStatus(
            prevState=>{
              return[
                ...prevState.slice(0,index),1,
                ...prevState.slice(index+1)
              ]
            }
          )
        }
      )
      
    })
  },[fileArray])

  const updatePatent = async (e) => {
    e.preventDefault()
    const path = base_url + "users/me/patents/" + patentId.id;
    const body = {
      patentName: patentDetail.patentName,
      description: patentDetail.description,
      s3Address: uploadPathFiles
    }
    await appContext.getAxios().put(path, body).then((response) => {
      handleClose();
    });
  };
  const handleFileUploadClick = async (event) => {
    try {
      const fileExtension = event.target.value.split(".").at(-1);
      if (fileExtension !== "pdf") {
        toast.error("Please upload pdf files!");
        event.target.value = null;
        return;
      }

      if (event.target.files.length > 3) {
        event.target.value = null
        toast.error("maximum 3 files")
        return
      }
      if ((fileNameArray.length + fileArray.length) + event.target.files.length > 3) {
        event.target.value = null
        toast.error("maximum 3 files")
        return

      }
      
      setFileArray((prevState) => [...prevState, ...event.target.files])
      

    } catch (error) {
      console.error(error)
    }

  };
  const onFocusOutControl=(e)=>{
    e.preventDefault();
    let inputvalue=e.target.value.trim();
    setPatentDetail({ ...patentDetail, [e.target.name]: inputvalue})
  }
  
  const onInputChange = (e) => {
    setEnableButton(false)
    e.preventDefault();
    let inputvalue=e.target.value;
    setPatentDetail({ ...patentDetail, [e.target.name]: inputvalue })

    if (e.target.name === "patentName") {
      if (inputvalue === '') {
        setNameError("Name is required")  
        setEnableButton(true)
      }
      else {
        setNameError('')
        if(inputvalue.length>=150){
          setNameLengthError("Maximum limit exceeded")
        }else{
          setNameLengthError('')
        }
      }
      
    }
    if (e.target.name === "description") {
      if (inputvalue === '') {
        setDescError("Description is required")
        setEnableButton(true)  
      }
      else {
        setDescError('')
        if(inputvalue.length>=800){
          setDescLengthError("Maximum limit exceeded")
        }
        else{
          setDescLengthError('')
        }
      }
      
    }
  }

  const fileUpload = async (file,index) => {
    let path = base_url + "users/me/patents/files";
    const form = new FormData()
    form.append("uploadfile", file)
  
    await appContext.getAxios().post(path, form).then((response) => {
      if (response !== undefined && response.status === 200) {
        
        uploadedFiles.push(response.data.filepath)
        setUploadPathFiles(prevState =>[...prevState,response.data.filepath])
      }
    }).catch(err => {
      console.log(err);
    })
    
  }

  const cancelFile = async (e, index) => {
    const path = base_url + "users/me/patents/files/" + fileNameArray[index].name
    setFileNameArray([
      ...fileNameArray.slice(0, index),
      ...fileNameArray.slice(index + 1, fileNameArray.length)])
    
    const files =uploadPathFiles.filter(res=>{
        return res !==fileNameArray[index].name}
    )
      setUploadPathFiles(files)
      setExistingFile(files)
      
    
    await appContext.getAxios().delete(path).then((response) => {
      setFileNameArray([
        ...fileNameArray.slice(0, index),
        ...fileNameArray.slice(index + 1, fileNameArray.length)
      ])
    }).catch(err => {
      console.log(err);
    })

  }

  const cancelNewFile = async (e,index) =>{
    setFileArray([
      ...fileArray.slice(0,index),
      ...fileArray.slice(index+1,fileArray.length)
    ])
  }

  return (
    <>
    <Modal
      dialogClassName="my-modal"
      className={localStorage.getItem("theme") ==="dark"?"dark":""}
      show={props.show}
      onHide={handleClose}
      backdrop="static"
    >
      <Modal.Header >
        <Modal.Title>
          <h3>Update Patent</h3>
        </Modal.Title>
        <button type="button" onClick={handleClose} className="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </Modal.Header>
      <Modal.Body>
        <>
          <div className="container">
            <form className="applyPatent" onSubmit={e => { updatePatent(e) }}>
              <div className="row top-wrap">
                <div className="col-12 mb-5">
                  <div className="row mb-5">
                    <div className="col-3 label">
                      <label htmlFor="mail">Patent name</label>
                    </div>
                    <div className="col-9">
                      <input
                        className={`form-control ${nameError ? 'is-invalid' : ''}  ${nameLengthError ? 'is-invalid' : ''}`}
                        type="text" maxLength="150"
                        name="patentName"
                        placeholder="Patent name"
                        value={patentDetail.patentName} 
                        onChange={(e) => onInputChange(e)} onBlur={(e)=>onFocusOutControl(e)}
                      />
                       {nameError ? <div className="invalid-feedback ">{nameError}</div> : ''}
                       {nameLengthError ? <div className="invalid-feedback ">{nameLengthError}</div> : ''}
                    </div>
                  </div>
                  <div className="row mb-5">
                    <div className="col-3 label">
                      <label htmlFor="mail">Description</label>
                    </div>
                    <div className="col-9">
                      <textarea
                        className={`form-control ${descError ? 'is-invalid' : ''} ${descLengthError ? 'is-invalid' : ''}`}
                        name="description"  maxLength="800"
                        placeholder="Description"
                        onChange={(e) => onInputChange(e)}
                        value={patentDetail.description} onBlur={(e)=>onFocusOutControl(e)}
                      />
                       {descError ? <div className="invalid-feedback ">{descError}</div> : ''}
                       {descLengthError ? <div className="invalid-feedback ">{descLengthError}</div> : ''}
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-3">
                      <label htmlFor="documents">Documents</label>
                    </div>
                    <div className="col-9">
                      <input type="file"
                        className="form-control"
                        accept="application/pdf"
                        multiple="multiple"
                        onChange={(event) => { handleFileUploadClick(event) }}
                      />
                    </div>
                  </div>
                  <div className="row mb-2">
                    <div className="col-3">
                    </div>
                    <div className="col-9">
                      {fileNameArray.map((file, index) => (
                        <div className="row" key={index}>
                          <div className="col-11">
                            {file.name}
                          </div>
                          <div className="col-1">
                            {file.status === 0 ? <Spinner animation="border" variant="primary" className="uploadSpinner" role="status"></Spinner> : <Cursor onClick={e => { cancelFile(e, index) }} type="button"><i className="fa fa-times" aria-hidden="true"></i></Cursor>}
                          </div>
                        </div>

                      ))}
                      {fileArray.map((file, index) => (
                        <div className="row" key={index}>
                          <div className="col-11">
                            {file.name}
                          </div>
                          <div className="col-1">
                            {uploadStatus[index] === 0  ? <Spinner animation="border" variant="primary" className="uploadSpinner" role="status"></Spinner> : <Cursor onClick={e => { cancelNewFile(e, index) }} type="button"><i className="fa fa-times" aria-hidden="true"></i></Cursor>}
                          </div>
                        </div>

                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-1 mb-4" style={{ float: "right" }}>
                <Button variant="primary" style={{backgroundColor:'#144399'}} className="mr-3" disabled={enableButton} type="submit">
                  Submit
                </Button>
                <Button variant="secondary" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
         
        </>
      </Modal.Body>
    </Modal>
   
    </>
  );
};

export default PatentModal;
