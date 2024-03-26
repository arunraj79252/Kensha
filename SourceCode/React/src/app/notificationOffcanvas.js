import Offcanvas from 'react-bootstrap/Offcanvas';
import React from 'react';
import moment from 'moment';
import useAppContext from '../AppContext';
import { useNavigate } from "react-router-dom";
const NotificationOffcanvas = (props) => {
  const navigate = useNavigate();
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const appContext = useAppContext();
  const notificationClick = async (resultObj) => {
    // window.open(link)
    if(resultObj.status===0){
      let path = base_url + "users/me/notification/"+resultObj.id;
      await appContext.getAxios().patch(path).then((response) => {
        if (response !== undefined && response.status === 200) {
          props.count();
          navigate(resultObj.click_action)
          props.close();
          // setNotificationList(response.data.data);
        }
      }).catch(err => {
        console.log(err);
      })
    }else{
      navigate(resultObj.click_action)
    }
  }
  return (
    <Offcanvas className={localStorage.getItem("theme")==="dark"?"not-offcanvas":''} show={props.show} onHide={props.close} scroll="true" placement="end">
      <Offcanvas.Header >
        <Offcanvas.Title>Notification</Offcanvas.Title>
        <button type="button" className="close" onClick={props.close} data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </Offcanvas.Header>
      <Offcanvas.Body>
      {props.list.length>0?<div className=" list-group notificationpanel mb-2">
        {props.list.map((result, index) => {
          return (
            <div className='notificationborder' key={index}>
            <button onClick={(e)=>notificationClick(result)} className={"list-group-item list-group-item-action flex-column align-items-start "+ (result.status===0?'active':'read' )}>
            <div className={"d-flex w-100 justify-content-between "}>
              <h5 className="mb-1">{result.title}</h5>
              <small>{moment.utc(result.createdAt).local().startOf('seconds').fromNow()}</small>
            </div>
            <p className="mb-1">{result.body}</p>
            <small></small>
          </button>
          </div>
          );
        })}
 </div>:
 <div>No notifications</div>
 }
      </Offcanvas.Body>
    </Offcanvas>
  )
}

export default NotificationOffcanvas