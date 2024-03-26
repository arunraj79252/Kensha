import React, { useState, useEffect, useRef, useCallback } from "react";
import Table from 'react-bootstrap/Table';
import useAppContext from "../../AppContext";
import Spinner from 'react-bootstrap/Spinner'
import { MultiSelect } from 'primereact/multiselect';
import { useNavigate } from "react-router-dom";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import styled from "styled-components";
import Moment from 'moment';
import getStatusName from "../Status";


const Cursor = styled.div`
  cursor: pointer;
`
export default function MyPatents() {
  const appContext = useAppContext();
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const [myPatents, setMyPatents] = useState([])
  const [showSpinner, setShowSpinner] = useState([true]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [uploadPathFiles, setUploadPathFiles] = useState([])
  const [sortIcon, setSortIcon] = useState([]);
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [patentName, setPatentName] = useState('')
  const [description, setDescription] = useState('')
  const [, setTheme] = useState('')
  const arrayCheck = useRef()
  const reachBottom = useRef()
  const prevTokenStr = useRef()
  const nextTokenStr = useRef()
  const lag = useRef()
  const [aboveLoading, setAboveLoading] = useState(false)
  const [hasPrevious, setHasPrevious] = useState(false)

  const navigate = useNavigate()
  const [show, setShow] = useState(false);
  const handleClose = () => {
    setShow(false);
    setFileArray([]);
    setUploadStatus([]);
    setUploadPathFiles()
  }
  const [fileArray, setFileArray] = useState([])
  const [uploadStatus, setUploadStatus] = useState([])
  const [nameError, setNameError] = useState('')
  const [descError, setDescError] = useState('')
  const [fileError, setFileError] = useState('')
  const [nameLengthError, setNameLengthError] = useState('')
  const [descLengthError, setDescLengthError] = useState('')
  const [enableButton, setEnableButton] = useState(true)

  const handleShow = () => {
    setShow(true);
  }
  const [sort, setSort] = useState(true);
  const keyword = useRef()
  const statusFilter = useRef()
  let uploadedFiles = [];
  useEffect(() => {
    setSortIcon(<i className="fa-solid fa-sort" style={{ marginLeft: "1em" }}></i>);
    getMyPatents();
    lag.current = true
    reachBottom.current = false
    setTheme(localStorage.getItem("theme"))
  }, [])

  const observer = useRef()
  const lastBookElementRef = useCallback(node => {
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && lag.current === true) {
        if (loading) {
          getMoreData()
        }
        setLoading(true)
      }
    })
    if (node) observer.current.observe(node)


  }, [hasMore, loading])
  const observer2 = useRef()
  const firstPatentElementRef = useCallback(node => {
    if (observer2.current) observer2.current.disconnect()
    observer2.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasPrevious && lag.current === true && (myPatents.length === 500 || !hasMore)) {
        if (aboveLoading) {
          getPreviousData()
        }
        setAboveLoading(true)
      }
    })
    if (node) observer2.current.observe(node)


  }, [hasPrevious, aboveLoading])




  useEffect(() => {
    let filledArray = new Array(fileArray.length).fill(0);
    setUploadPathFiles([])
    arrayCheck.current = filledArray
    setUploadStatus(arrayCheck.current)
    fileArray.forEach((file, index) => {
      fileUpload(file, index).then(

        resp => {
          if(resp ===1){
          
          arrayCheck.current[index] = 1
          setUploadStatus(
            prevState => {
              return [
                ...prevState.slice(0, index), 1,
                ...prevState.slice(index + 1)
              ]
            }
          )
          }
          else{
            arrayCheck.current[index] = 2
            setUploadStatus(
              prevState => {
                return [
                  ...prevState.slice(0, index), 2,
                  ...prevState.slice(index + 1)
                ]
              }
            )
          }
        }
      )

    })
  }, [fileArray])

  useEffect(() => {

    if (fileArray.length >= 1) {
      if ((nameError === "" && patentName) && (descError === "" && description) && fileArray.length === uploadPathFiles.length) {

        setEnableButton(false)
      }
      else {
        setEnableButton(true)
      }
    }
    else {
      setEnableButton(true)
    }

  }, [uploadPathFiles, nameError, patentName, description, descError])
  useEffect(()=>{
    console.log(uploadStatus);
  },[uploadStatus])


  const patentClick = (e, id) => {
    e.preventDefault();
    localStorage.setItem("patentId", id);
    navigate("/patentD/" + id)
  }
  const getMyPatents = async () => {
    try {
      let dateSort = sort ? 1 : -1
      let path = base_url + 'users/me/patents';
      let params = {
        createdAt: dateSort,
        keyword: keyword.current,
        status: statusFilter.current
      }
      await appContext.getAxios().get(path, { params }).then((response) => {
        let patentList = []
        if (response !== undefined) {
          patentList = response.data.data;
          setShowSpinner(false)
          setMyPatents(patentList)
          nextTokenStr.current = [response.data.token];
          if (response.data.token) {
            setHasMore(true)
          }
          else {
            setHasMore(false)
          }
        }
      }
      )

    } catch (error) {
      console.error(error)
    }
  }
  const getMoreData = async (query) => {
    try {
      let dateSort = sort ? 1 : -1
      let path = base_url + 'users/me/patents';
      let params = {
        createdAt: dateSort,
        keyword: keyword.current,
        token: nextTokenStr.current[0],
        status: statusFilter.current
      }
      setLoading(true)
      await appContext.getAxios().get(path, { params }).then((response) => {
        setLoading(false)

        if (response !== undefined) {
          let allPatentList = response.data.data;
          let length = myPatents.length + response.data.data.length

          if (prevTokenStr.current) {
            if (prevTokenStr.current.length === 5) {
              if (!reachBottom.current) {
                let arr = [...prevTokenStr.current.slice(1, 5), response.data.previousToken]
                prevTokenStr.current = arr

              }
              else {
                reachBottom.current = false
              }

            }
            else {
              let arr = [...prevTokenStr.current, response.data.previousToken]
              prevTokenStr.current = arr

            }


          }
          else {
            let arr = [response.data.previousToken]
            prevTokenStr.current = arr
          }


          if (length > 500) {
            lag.current = false
            setHasMore(false)
            setHasPrevious(true)


            setTimePatents(allPatentList).then(() => {
              setTimeout(() => {
                executeScroll()
              }, 300);

            })

            setLoading(false)
            setTimeout(() => {
              lag.current = true
            }, 500);

          }
          else {
            setMyPatents((prevState) => [...prevState, ...allPatentList]);

          }
          if (response.data.token) {
            if (nextTokenStr.current.length >= 5) {
              let a = [response.data.token, ...nextTokenStr.current]

              nextTokenStr.current = a
            }
            else {
              nextTokenStr.current = [response.data.token, ...nextTokenStr.current]
            }


            setHasMore(true)
          }
          else {
            setHasMore(false)
          }
          setLoading(false)
        }
      }
      )

    } catch (error) {
      console.error(error)
    }
  }
  const setTimePatents = async (array) => {
    setMyPatents((prevState) => [...prevState.slice(100, 500), ...array], executeScroll());
  }
  const getPreviousData = async () => {
    try {
      let dateSort = sort ? 1 : -1
      let path = base_url + 'users/me/patents';
      let params = {
        createdAt: dateSort,
        keyword: keyword.current,
        token: prevTokenStr.current[0],
        status: statusFilter.current
      }
      await appContext.getAxios().get(path, { params }).then((response) => {
        if (response !== undefined) {
          setAboveLoading(false)
          let allPatentList = response.data.data
          lag.current = false
          if (response.data.previousToken) {
            setHasPrevious(true)
            prevTokenStr.current = [response.data.previousToken, ...prevTokenStr.current.slice(0, prevTokenStr.current.length - 1)]

          }
          else {
            setHasPrevious(false)
            reachBottom.current = true
          }
          setConditionalPatents(allPatentList).then(() => {
            setTimeout(() => {
              executeFirstScroll()

            }, 300);
          })
          setAboveLoading(false)
          if (hasMore) {
            nextTokenStr.current = nextTokenStr.current.slice(1, nextTokenStr.current.length)

          }
          setHasMore(true)


          setTimeout(() => {
            lag.current = true

          }, 500);

        }
      })
    }
    catch (error) {
      console.error(error)
    }

  }
  const setConditionalPatents = async (array) => {
    setMyPatents((prevState) => [...array, ...prevState.slice(0, 400)], executeFirstScroll())
  }
  const executeScroll = async () => {
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight / 1.27, behavior: 'auto' })
    }, 100);

  }
  const executeFirstScroll = async () => {
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight / 4.85, behavior: 'auto' })

    }, 100);
  }
  const onStatusChange = async (value) => {
    setShowSpinner(true)
    let selected = [];
    if (value.length !== 0) {
      selected.push(value[value.length - 1])
      setSelectedStatus(selected)
      statusFilter.current = selected[0].code;
      getMyPatents()

    }
    else {
      statusFilter.current = null;
      setSelectedStatus(null)
      getMyPatents();
    }

  }
  const status = [
    { name: 'Applied', code: 0 },
    { name: 'Review started', code: 1 },
    { name: 'Transaction pending', code: 2 },
    { name: 'Rejected', code: 3 },
    { name: 'Approved', code: 4 },
    { name: 'Resubmitted', code: 5 },
    {name:'Ready for payment',code :6}
  ];

  const applyPatent = async event => {
    setEnableButton(true)
    event.preventDefault();
    try {
      if (event.target.patentName.value === null || event.target.patentName.value === "") {
        setNameError("Name is required")
        return;
      } else {
        setNameError("")
      }
      if (event.target.description.value === null || event.target.description.value === "") {
        setDescError("Description is required")
        return;
      } else {
        setDescError("")
      }
      if (fileArray.length === 0) {
        setFileError("Document is required")
        return;
      }
      else {
        setFileError("")
      }
      let uploadFile = []
      fileArray.forEach(item => {
        uploadFile.push(item.name)
      })
      const path = base_url + "users/me/patents";
      const body = {
        patentName: patentName,
        publicAddress: localStorage.getItem("accountAddress"),
        description: description,
        uploadfile: uploadPathFiles
      }

      await appContext.getAxios().post(path, body).then((response) => {
        toast.success("Patent Created")
        setTimeout(() => {
          handleClose();
        }, 500);
        getMyPatents()
      });

    } catch (error) {
      console.error(error)
    }
  }
  const cancelFile = (e, index) => {

    setFileArray([
      ...fileArray.slice(0, index),
      ...fileArray.slice(index + 1, fileArray.length)
    ])

  }
  const handleFileUploadClick = async (event) => {
    try {
      let files = event.target.files
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
      if (fileArray.length + event.target.files.length > 3) {
        event.target.value = null
        toast.error("maximum 3 files")

      }
     
      setFileArray((prevState) => [...prevState, ...files])
      setFileError("")
      setTimeout(() => {
        event.target.value = null
      }, 1000);
    } catch (error) {
      console.error(error)
    }
  }
  const fileUpload = async (file, index) => {
    return new  Promise((resolve) => {
      let path = base_url + "users/me/patents/files";
    const form = new FormData()
    form.append("uploadfile", file)
    console.log(file);
     appContext.getAxios().post(path, form).then((response) => {
      if (response !== undefined && response.status === 200) {
        uploadedFiles.push(response.data.filepath)
        setUploadPathFiles(prevState => [...prevState, response.data.filepath])
        resolve(1)
      }
    }).catch(err => {
      console.log(err);
      resolve(2)
    })
    })
    

  }
  const onDateSort = (event) => {
    setSort(!sort)
    if (sort) {
      setSortIcon(<i className="fa-solid fa-sort-up" style={{ marginLeft: "1em" }}></i>)
      getMyPatents()
    }

    else {
      setSortIcon(<i className="fa-solid fa-sort-down" style={{ marginLeft: "1em" }}></i>)
      getMyPatents()
    }
  }
  const buttonClick = (e) => {
    e.preventDefault()
    let value = e.target[0].value
    keyword.current = value
    getMyPatents()

  };
  const onInputChange = (e) => {
    e.preventDefault();
    if (e.target.value === '') {
      keyword.current = ''
      getMyPatents()
    }
  }


  const onFormInputChange = (e) => {
    e.preventDefault();
    let inputvalue = e.target.value.trim();
    if (e.target.name === "patentName") {
      setPatentName(inputvalue)
      if (inputvalue === '') {
        setNameError("Name is required")
        setEnableButton(true)
      }
      else {
        setNameError('')
        if (inputvalue.length >= 150) {
          setNameLengthError("Maximum limit exceeded")
        } else {
          setNameLengthError('')
        }
      }

    }
    if (e.target.name === "description") {
      setDescription(inputvalue)
      if (inputvalue === '') {
        setDescError("Description is required")
        setEnableButton(true)
      }
      else {
        setDescError('')
        if (inputvalue.length >= 800) {
          setDescLengthError("Maximum limit exceeded")
        }
        else {
          setDescLengthError('')
        }
      }

    }

   

  }

  return (
    <>
      <div className="container table_container mb_L">

        <div className="panel">
          <div className="panel-heading">My Patents</div>
          <div className="pc-task_list">
            <div className="row py-3">
              <div className="col-lg-6"></div>
              <div className="col-lg-3">
                <div className="" style={{ float: "right" }}>
                  <Button style={{ backgroundColor: '#144399' }} onClick={handleShow}>  Apply Patent </Button>
                </div>
              </div>
              <div className="col-lg-3">
                <form onSubmit={e => buttonClick(e)} >
                  <div className="input-group">
                    <input
                      type="search" onChange={onInputChange}
                      className="form-control"
                      placeholder="Search "
                    />
                    <span className="input-group-btn pl-1">
                      <button
                        className="btn btn-search"
                        style={{
                          backgroundColor: "#144399",
                          color: "white",
                        }}
                        type="submit"
                      >
                        <i className="fa fa-search fa-fw"></i>{" "}
                      </button>
                    </span>
                  </div>
                </form>
              </div>
            </div>


            <Table responsive className="shadow">
              <thead>
                <tr>
                  <th style={{ width: "5%" }}>Sl.no</th>
                  <th style={{ width: "20%",whiteSpace: "nowrap" }}>Patent Name</th>
                  <th style={{ width: "30%" }}>Description</th>
                  <th style={{ width: "12%" }} onClick={onDateSort}>Date {sortIcon}</th>
                  <th style={{ width: "18%",whiteSpace: "nowrap" }}>Status <MultiSelect value={selectedStatus} options={status} onChange={(e) => onStatusChange(e.value)} optionLabel="name" placeholder="" maxSelectedLabels={1} /></th>
                </tr>
              </thead>
              <tbody>
                {aboveLoading ?
                  <tr><td
                    className="text-center border-cstm-btm" colSpan={6}>
                    <Spinner animation="border" variant="primary" role="status">
                    </Spinner>
                  </td>
                  </tr>
                  : ""}
                {myPatents.length > 0 ?
                  myPatents.map((result, index) => {

                    if (index === 0) {
                      return (
                        <tr ref={firstPatentElementRef} style={{
                          "borderColor": "inherit",
                          "borderStyle": "solid",
                          "borderWidth": "thin"
                        }} key={index} >



                          <td>{result.index}</td>

                          <td><a onClick={e => patentClick(e, result.id)} href=" ">{result.patentName}</a></td>
                          <td className="td_textwrap">{result.description}</td>
                          <td style={{whiteSpace: "nowrap"}}>{Moment(result.createdAt).format('DD-MM-YYYY')}</td>
                          <td>{getStatusName(result.status)}</td>
                        </tr>
                      )
                    }

                    if (myPatents.length === index + 1) {
                      return (
                        <tr ref={lastBookElementRef} style={{
                          "borderColor": "inherit",
                          "borderStyle": "solid",
                          "borderWidth": "thin"
                        }} key={index} >



                          <td>{result.index}</td>

                          <td><a onClick={e => patentClick(e, result.id)} href=" ">{result.patentName}</a></td>
                          <td className="td_textwrap">{result.description}</td>
                          <td>{Moment(result.createdAt).format('DD-MM-YYYY')}</td>
                          <td>{getStatusName(result.status)}</td>
                        </tr>
                      )
                    }
                    return (
                      <tr style={{
                        "borderColor": "inherit",
                        "borderStyle": "solid",
                        "borderWidth": "thin"
                      }} key={index} >
                        <td>{result.index}</td>

                        <td><a onClick={e => patentClick(e, result.id)} href=" ">{result.patentName}</a></td>
                        <td className="td_textwrap">{result.description}</td>
                        <td>{Moment(result.createdAt).format('DD-MM-YYYY')}</td>
                        <td>{getStatusName(result.status)}</td>
                      </tr>
                    );
                  }) : <tr><td
                    className="text-center border-cstm-btm" colSpan={5}>
                    {showSpinner ? <Spinner animation="border" variant="primary" role="status">
                    </Spinner> : 'No data'}
                  </td>
                  </tr>}


              </tbody>
            </Table>
            <div className="text-center">
              {loading ? <Spinner animation="border" variant="primary" role="status" >
              </Spinner> : ''}
            </div>
          </div>
        </div>
      </div>
      <Modal dialogClassName="my-modal" show={show} onHide={handleClose} className={localStorage.getItem("theme") === "dark" ? "dark" : ""} backdrop="static">
        <Modal.Header >
          <Modal.Title><h3>Apply Patent</h3></Modal.Title>
          <button type="button" onClick={handleClose} className="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </Modal.Header>
        <Modal.Body>
          <>
            <div className="container">
              <form className='applyPatent' onSubmit={applyPatent}>
                <div className="row top-wrap">

                  <div className="col-12 mb-5">
                    <div className="row mb-5">
                      <div className="col-3 label">
                        <label htmlFor="mail">Patent name</label>
                      </div>
                      <div className="col-9">
                        <input className={`form-control ${nameError ? 'is-invalid' : ''} ${nameLengthError ? 'is-invalid' : ''}`} type="text" autoComplete="off" name="patentName" placeholder="Patent name" onChange={e => onFormInputChange(e)} maxLength="150" />
                        {nameError ? <div className="invalid-feedback ">{nameError}</div> : ''}
                        {nameLengthError ? <div className="invalid-feedback ">{nameLengthError}</div> : ''}
                      </div>
                    </div>
                    <div className="row mb-5">
                      <div className="col-3 label">
                        <label htmlFor="mail">Description</label>
                      </div>
                      <div className="col-9">
                        <textarea className={`form-control ${descError ? 'is-invalid' : ''} ${descLengthError ? 'is-invalid' : ''}`} name="description" placeholder="Description" onChange={e => onFormInputChange(e)} maxLength="800" />
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
                          className={`form-control ${fileError ? 'is-invalid' : ''}`}
                          accept="application/pdf"
                          multiple="multiple"
                          onChange={(event) => { handleFileUploadClick(event) }}
                        />
                        {fileError ? <div className="invalid-feedback ">{fileError}</div> : ''}
                      </div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-3">
                      </div>
                      <div className="col-9">
                        {fileArray.map((file, index) => (

                          <div className={`row ${uploadStatus[index] ===2 ?'text-danger':''}`} key={index}>
                            <div className="col-11">
                              {file.name}
                            </div>
                            <div className="col-1">
                              {uploadStatus[index] === 0 ? <Spinner animation="border" variant="primary" className="uploadSpinner" role="status"></Spinner> : <Cursor onClick={e => { cancelFile(e, index) }} type="button"><i className="fa fa-times" aria-hidden="true"></i></Cursor>}
                            </div>
                          </div>

                        ))}
                      </div>
                    </div>
                  </div>

                </div>


                <div className="mt-1 mb-4" style={{ "float": "right" }}>
                  <Button variant="primary" style={{ backgroundColor: '#144399' }} className="mr-3" disabled={enableButton} type="submit">Submit</Button>
                  <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                </div>
              </form>
            </div>

          </>
        </Modal.Body>
      </Modal>
    </>
  );
}
