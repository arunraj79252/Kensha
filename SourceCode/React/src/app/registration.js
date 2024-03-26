


import React, { useRef, useState } from 'react'
import { Button } from 'react-bootstrap'
import styled from 'styled-components'
import Image from '../app/images/blockchain.jpg'
import '../App.css'
import { toast } from "react-toastify";
import useAppContext from '../AppContext'
import { requestForToken } from './firebase'

const Padding = styled.div`
padding:20px 0px;
`
const Title = styled(Padding)`
     font-size: 2.2rem;

`
const Blue = styled.span`
    color: #144399;
`


const Registration = () => {
    const appContext = useAppContext();
    const init = useRef()
    const [nameError, setNameError] = useState('')
    const [emailError, setEmailError] = useState('')
    const [phoneError, setPhoneError] = useState('')
    const [pinError, setPinError] = useState('')
    const [nameValid, setNameValid] = useState(false)
    const [emailValid, setEmailValid] = useState(false)
    const [enableButton, setEnableButton] = useState(true)
    const accountAddress = localStorage.getItem("accountAddress");
    const base_url = process.env.REACT_APP_API_ENDPOINT;
    const [user, setUser] = useState({
        name: '',
        phoneNo: '',
        email: '',
        address: '',
        pincode: '',
        district: '',
        publicAddress: '',
        status: 1,
    })
    init.current = user
    const { name, phoneNo, email, address, pincode, district } = user;
    const onInputChange = e => {
        e.preventDefault();
        setUser({ ...user, [e.target.name]: e.target.value })
        if (e.target.name === "name" && e.target.value === '') {
            setNameError("Name is required")
            setEnableButton(true)
        }
        else {
            setNameError('')
            setNameValid(true)
            let flag = (emailValid && !pinError && !phoneError) ? false : true
            setEnableButton(flag)
        }

        if (e.target.name === "email") {
            let email = e.target.value
            let emailCheck = new RegExp(/^[\w-]+@([\w-]+\.)+[\w-]{2,4}$/g).test(email);
            if (email === '') {
                setEnableButton(true)
                setEmailError("Email is required")
            }
            else if (!emailCheck) {
                setEmailError('Enter valid Email')
                setEnableButton(true)
            }
            else {
                setEmailError('')
                setEmailValid(true)
                let flag = (nameValid && !pinError && !phoneError) ? false : true
                setEnableButton(flag)
            }
        }
        if (e.target.name === "phoneNo") {
            let phoneNo = e.target.value
            let phoneCheck = new RegExp(/^\d{10}$/).test(phoneNo)
            if (phoneNo !== '' && !phoneCheck) {
                setEnableButton(true)
                setPhoneError("Enter valid phone no")
            }
            else {
                setPhoneError('')
                let flag = (emailValid && nameValid && !pinError) ? false : true
                setEnableButton(flag)

            }
        }
        if (e.target.name === "pincode") {
            let pinCheck = new RegExp(/^\d{6}$/).test(e.target.value)
            if (e.target.value !== '' && !pinCheck) {
                setPinError("Enter valid pin")
                setEnableButton(true)
            }
            else {
                setPinError('')
                let flag = (emailValid && nameValid && !phoneError) ? false : true
                setEnableButton(flag)
            }
        }
    }
    const handleSubmit = async () => {
        user.publicAddress = accountAddress;
        const path = base_url + "users";
        await appContext.getAxios().post(path, user).then((response) => {
            if (response !== undefined && response.status === 200) {
                localStorage.setItem("name", user.name)
                localStorage.setItem("status", 1);
                toast.success("Registered Successfully !");
                requestForToken(appContext.getAxios());
                setTimeout(() => {
                    window.location.pathname = "/home";
                }, 1500);
            }
            else {
                toast.error("Error !");
            }
        }, (error) => {
            console.log("Error", error.response)
        });
    }
    const handleReset = () => {
        setUser({
            name: '',
        phoneNo: '',
        email: '',
        address: '',
        pincode: '',
        district: '',
        })
        document.getElementById('regForm').reset();
    }
    return (

        <div className='container'>
            <div className='row'>
                <div className='col-lg-6 col-0 ' style={{ backgroundImage: `url(${Image})` }}>


                </div>
                <div className='col-lg-6 shadow p-3  reg-container rounded col-12' >
                    <div className="row">
                        <div className="col-lg-1"></div>
                        <div className="col-lg-10"> <Title className=''>Welcome to <Blue>Kensha</Blue> </Title></div>
                        <div className="col-lg-1"></div>
                    </div>
                    <div className="row">
                        <div className="col-lg-1"></div>
                        <div className="col-lg-10"> <p className='mb-4'>Blockchain.com is a cryptocurrency financial services company. The company began as the first
                            Bitcoin blockchain explorer in 2011 and later created a cryptocurrency wallet that accounted for 28% of bitcoin transactions
                            between 2012 and 2020.</p></div>
                        <div className="col-lg-1"></div>
                    </div>
                    <div className="row">
                        <div className="col-lg-1"></div>
                        <div className="col-lg-10">

                            <form id='regForm'>
                                <div className="form-floating mb-3 has-validation">
                                    <input type="text" className={`form-control ${nameError ? 'is-invalid' : ''}`} autoComplete="off" id="validationServerUsername" name='name' value={name} onChange={e => onInputChange(e)} placeholder="Name" />
                                    <label>Name *</label>
                                    {nameError ? <div className="invalid-feedback ">{nameError}</div> : ''}
                                </div>
                                <div className="form-floating mb-3 ">
                                    <input type="text" className={`form-control ${emailError ? 'is-invalid' : ''}`} autoComplete="off" name='email' value={email} id="exampleFormControlInput1" onChange={e => onInputChange(e)} placeholder="Email" />
                                    <label>Email *</label>
                                    {emailError ? <div className="invalid-feedback ">{emailError}</div> : ''}
                                </div>
                                <div className="form-floating mb-3 ">
                                    <input type="text" className={`form-control ${phoneError ? 'is-invalid' : ''}`} autoComplete="off" name='phoneNo' value={phoneNo} id="exampleFormControlInput1" onChange={e => onInputChange(e)} placeholder="Phone no" />
                                    <label>Phone no</label>
                                    {phoneError ? <div className="invalid-feedback ">{phoneError}</div> : ''}
                                </div>
                                <div className="form-floating mb-3 ">
                                    <input type="text" className="form-control" name='address' value={address} id="exampleFormControlInput1" autoComplete="off" onChange={e => onInputChange(e)} placeholder="Address" />
                                    <label>Address</label>
                                </div>

                                <div className="form-floating mb-3 ">
                                    <input type="text" className={`form-control ${pinError ? 'is-invalid' : ''}`} autoComplete="off" name='pincode' value={pincode} id="exampleFormControlInput1" onChange={e => onInputChange(e)} placeholder="Pin code" />
                                    <label>Pin code</label>
                                    {pinError ? <div className="invalid-feedback ">{pinError}</div> : ''}
                                </div>

                                <div className="form-floating mb-3 ">
                                    <input type="text" className="form-control" name='district' value={district} id="exampleFormControlInput1" autoComplete="off" onChange={e => onInputChange(e)} placeholder="Ditrict" />
                                    <label>District</label>
                                </div>

                                <div className="row mt-5 ">
                                    <div className="col-3"></div>
                                    <div className="col-3"><Button type='button' style={{backgroundColor:'#144399'}} onClick={() => handleSubmit()} disabled={enableButton} className={`m-2 ${enableButton ? 'disableButton' : ''}`}>Submit</Button></div>

                                    <div className="col-3"><Button className="m-2 btn-secondary" onClick={handleReset} type='button'>Clear</Button></div>
                                    <div className="col-3"></div>
                                </div>

                            </form>
                        </div>
                        <div className="col-lg-1"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Registration