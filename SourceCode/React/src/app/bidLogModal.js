import React, { useState ,useEffect } from 'react'
import { Button, Modal } from 'react-bootstrap'
import useAppContext from "../AppContext";
import Table from 'react-bootstrap/Table';
import { toast } from "react-toastify";
const BidLogModal = (props) => {
    const base_url = process.env.REACT_APP_API_ENDPOINT;
    const appContext = useAppContext();
    const [bidLogs, setBidLogs] = useState([])
    const [enableButton,setEnableButton] = useState(true)
    const handleClose = () => {
        props.close()
    }
    useEffect(() => {
        setBidLogs(props.patentDetail.bidLog)
    }, []);
    const approve = async () => {
        try {
            setEnableButton(false)
            let path = base_url + "users/me/patents/approveBuyer/" + props.patentDetail.id;
            let body = {
                buyer: bidLogs[bidLogs.length - 1].userPublicAddress,
                price: bidLogs[bidLogs.length - 1].amount
            }
            await appContext.getAxios().patch(path, body).then((res) => {
                setEnableButton(false)
                console.log(res);
                toast.success("Bid Approved")
                setTimeout(() => {
                    props.close()
                    setEnableButton(true)
                }, 500);
            })
        } catch (error) {
            console.error("Error", error);
        }

    };

    return (
        <Modal size='md' centered show={props.show} className={localStorage.getItem("theme") === "dark" ? "dark" : ""} onHide={handleClose} backdrop="static">
            <Modal.Header >
                <Modal.Title><h3>Bid Log</h3></Modal.Title>
                <button type="button" onClick={handleClose} className="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </Modal.Header>
            <Modal.Body>
                <Table className="shadow bg-white rounded" responsive>
                    <thead>
                        <tr>
                            <th style={{ width: "5%" }}>Sl.no</th>
                            <th style={{ width: "20%" }}>Name</th>
                            <th style={{ width: "10%" }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bidLogs.length > 0
                            ? bidLogs.map((result, index) => {
                                return (
                                    <tr
                                        style={{
                                            borderColor: "inherit",
                                            borderStyle: "solid",
                                            borderWidth: "thin",
                                        }} key={index}>
                                        <td>{index+1}</td>
                                        <td>

                                            {result.userName}
                                        </td>
                                        <td className="td_textwrap">{result.amount}</td>
                                        
                                    </tr>
                                );

                            })
                            : <tr><td> No data
                            </td>
                            </tr>}
                    </tbody>
                </Table>
                            
               
            </Modal.Body>
            <Modal.Footer>
            {bidLogs.length>0 && props.userType ===1 &&<Button disabled={!enableButton } variant="primary" style={{ backgroundColor: '#144399' }} className="" type="submit" onClick={approve}>Approve</Button>}
            </Modal.Footer>
        </Modal>
    )
}

export default BidLogModal