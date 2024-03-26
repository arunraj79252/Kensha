import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import useAppContext from "../AppContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const profileDetails = () => {
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [pinError, setPinError] = useState("");
  const [nameValid, setNameValid] = useState(false)
  const [emailValid, setEmailValid] = useState(true)
  const [enableButton, setEnableButton] = useState(false);
  const accountAddress = localStorage.getItem("accountAddress");
  const base_url = process.env.REACT_APP_API_ENDPOINT;
  const appContext = useAppContext();
  const [user, setUser] = useState({
    name: "",
    phoneNo: "",
    email: "",
    address: "",
    pincode: "",
    district: "",
    publicAddress: "",
    status: 1,
  });

  const { name, phoneNo, email, address, pincode, district } =
    user;

  useEffect(() => {
    getUserDetails();
  }, []);

  const handleSubmit = async () => {
    user.publicAddress = accountAddress;

    const path = base_url + "users/me";

    await appContext
      .getAxios()
      .put(path, user)
      .then(
        (response) => {
          if (response !== undefined && response.status === 200) {
            localStorage.setItem("name",user.name)
            toast.success("Profile Updated Successfully !");
            setEnableButton(true);
          }
        },
        (error) => {
          toast.error("Error !",error);
        }
      );
  };

  const onInputChange = (e) => {
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

  };
  const getUserDetails = async () => {
    const path = base_url + "users/me";

    try {
    } catch (error) { }
    await appContext
      .getAxios()
      .get(path)
      .then(
        (response) => {
          setUser(response.data);
        },
        (error) => {
          toast.error(error);
        }
      );
  };

  return (
    <>
      <div className="container">
        <div className="row">
          <div className="col-lg-2 col-0"></div>
          <div className="col-lg-8 shadow p-3 rounded  col-12">
            <h1 className="text-center my-5">Profile Details </h1>
            <div className="row">
              <div className="col-lg-1"></div>
              <div className="col-lg-10">
                <form>
                  <div className="form-floating mb-3 has-validation">
                    <input
                      type="text"
                      autoComplete="false"
                      className={`form-control ${nameError ? "is-invalid" : ""
                        }`}
                      id="validationServerUsername"
                      name="name"
                      value={name}
                      onChange={(e) => onInputChange(e)}
                      placeholder="Name"
                    />
                    <label>Name *</label>
                    {nameError ? (
                      <div className="invalid-feedback ">{nameError}</div>
                    ) : (
                      ""
                    )}
                  </div>
                  <div className="form-floating mb-3 ">
                    <input
                      type="text"
                      readOnly
                      className={`form-control ${emailError ? "is-invalid" : ""
                        }`}
                      name="email"
                      value={email}
                      id="exampleFormControlInput1"
                      onChange={(e) => onInputChange(e)}
                      placeholder="Email"
                    />
                    <label>Email *</label>
                    {emailError ? (
                      <div className="invalid-feedback ">{emailError}</div>
                    ) : (
                      ""
                    )}
                  </div>
                  <div className="form-floating mb-3 ">
                    <input
                      type="text"
                      autoComplete="false"
                      className={`form-control ${phoneError ? "is-invalid" : ""
                        }`}
                      name="phoneNo"
                      value={phoneNo}
                      id="exampleFormControlInput1"
                      onChange={(e) => onInputChange(e)}
                      placeholder="Phone no"
                    />
                    <label>Phone no</label>
                    {phoneError ? (
                      <div className="invalid-feedback ">{phoneError}</div>
                    ) : (
                      ""
                    )}
                  </div>
                  <div className="form-floating mb-3 ">
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      autoComplete="false"
                      value={address}
                      id="exampleFormControlInput1"
                      onChange={(e) => onInputChange(e)}
                      placeholder="Address"
                    />
                    <label>Address</label>
                  </div>
                  <div className="form-floating mb-3 ">
                    <input
                      type="text"
                      className={`form-control ${pinError ? "is-invalid" : ""}`}
                      name="pincode"
                      autoComplete="false"
                      value={pincode}
                      id="exampleFormControlInput1"
                      onChange={(e) => onInputChange(e)}
                      placeholder="Pin code"
                    />
                    <label>Pin code</label>
                    {pinError ? (
                      <div className="invalid-feedback ">{pinError}</div>
                    ) : (
                      ""
                    )}
                  </div>

                  <div className="form-floating mb-3 ">
                    <input
                      type="text"
                      className="form-control"
                      name="district"
                      value={district}
                      autoComplete="false"
                      id="exampleFormControlInput1"
                      onChange={(e) => onInputChange(e)}
                      placeholder="Ditrict"
                    />
                    <label>District</label>
                  </div>
                  <div className="row mt-5 ">
                    <div className="col-3"></div>
                    <div className="col-3 text-center">
                      <button
                        type="button"
                        style={{backgroundColor:'#144399'}}
                        onClick={() => handleSubmit()}
                        disabled={enableButton}
                        className="m-2 btn btn-primary btn-block "
                      >
                        Submit
                      </button>
                    </div>
                    <div className="col-3 text-center">
                      <Link to="/home">
                        <Button
                          className="m-2 btn btn-secondary btn-block"
                          type="button"
                        >
                          Cancel
                        </Button>
                      </Link>
                    </div>
                    <div className="col-3"></div>
                  </div>
                </form>
              </div>
              <div className="col-lg-1"></div>
            </div>
          </div>
          <div className="col-lg-2 col-0"></div>
        </div>
      </div>


    </>
  );
};

export default profileDetails;
