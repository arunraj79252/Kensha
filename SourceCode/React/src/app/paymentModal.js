import React, {  useState } from 'react'
import { Modal } from 'react-bootstrap'
import { Steps } from 'primereact/steps';
import { ProgressBar } from 'primereact/progressbar';
const PaymentModal = (props) => {
    const [activeIndex, setActiveIndex] = useState(1);
    const handleClose = () => {
        props.close()
    }

    const items = [
        {
            label: 'Initiating',
            command: (event) => {
            }
        },
        {
            label: 'Processing',
            command: (event) => {

            }
        },
        {
            label: 'Payment Success',
            command: (event) => {

            }
        }
    ];

    return (
        <>

            <Modal dialogClassName="payment-modal" show={props.show} className={localStorage.getItem("theme") === "dark" ? "dark" : ""} onHide={handleClose} backdrop="static">

                <Modal.Body>

                    <Steps className='m-4' model={items} activeIndex={props.status} onSelect={(e) => setActiveIndex(e.index)} readOnly={true}/>
                    <div className='pt-2'></div>
                    {props.status!==4&&<ProgressBar className='mt-1' mode="indeterminate" style={{ height: '6px' }}></ProgressBar>}
                    <div className="container mb-5" style={{ textAlign: "center" }}>

                        <h2 className='mb-4'>Payment Processing</h2>
                        <div className='mb-4'>
                           <h5> Transaction has been initiated. Please wait</h5>

                        </div>

                    </div>
                </Modal.Body>

            </Modal>
        </>
    )
}

export default PaymentModal