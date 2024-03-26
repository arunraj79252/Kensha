import React, { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap';
import Table from 'react-bootstrap/esm/Table';
import { useNavigate } from 'react-router-dom';
import useAppContext from '../AppContext';

const MyBids = () => {
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const appContext = useAppContext();
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  useEffect(() => {
    bidDetails()
  }, [])
  const bidDetails = async () => {
    let path = base_url + "users/me/patents/bid/list/" + localStorage.getItem("accountAddress")
    await appContext.getAxios().get(path).then((res) => {
      console.log(res);
      setLoading(false)
      setBids(res.data)

    })

    

  }
  const patentClick =(e,id)=>{
    e.preventDefault();
    navigate("/patentDetails/" + id)
  }
  useEffect(()=>{
    console.log(bids);
  },[bids])
  return (
    <div className="container table_container mb_L">

      <div className="panel">
        <div className="panel-heading">My Patents</div>
        <div className="pc-task_list">
          <div className="row py-3">
            <div className="col-lg-6"></div>
            <div className="col-lg-3">
            </div>
            <div className="col-lg-3">
              {/* <form onSubmit={e => buttonClick(e)} >
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
                </form> */}
            </div>
          </div>


          <Table responsive className="shadow">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>Sl.no</th>
                <th style={{ width: "20%", whiteSpace: "nowrap" }}>Patent Name</th>
                <th style={{ width: "30%" }}>Description</th>
                <th style={{ width: "12%" }} >Bid Status </th>
              </tr>
            </thead>
            <tbody>
              {/* {loading && <tr><td
                className="text-center border-cstm-btm" colSpan={4}>
                <Spinner animation="border" variant="primary" role="status">
                </Spinner>
              </td>
              </tr>} */}
              {bids.length>0 ?
               bids.map((res,index)=>{
                return(
                  <tr style={{
                    "borderColor": "inherit",
                    "borderStyle": "solid",
                    "borderWidth": "thin"
                  }} key={index} >
                  <td>{index+1}</td>
                  <td><a onClick={e => patentClick(e, res._id)} href=" ">{res.patentName}</a></td>
                  <td>{res.description}</td>
                  <td>{res.bidStatus}</td>

                  </tr>
                )
               }):
               <tr><td
                className="text-center border-cstm-btm" colSpan={4}>
                {loading?<Spinner animation="border" variant="primary" role="status">
                </Spinner>:'No bids'}
              </td>
              </tr>
            }
             


                </tbody>
          </Table>
          <div className="text-center">
            {/* {loading ? <Spinner animation="border" variant="primary" role="status" >
              </Spinner> : ''} */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyBids