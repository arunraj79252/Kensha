import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Web3 from "web3";
import "../css/theme.min.css";
import axios from "axios";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import styled from "styled-components";
import useAppContext from "../AppContext";
import { Outlet,Link, useNavigate } from "react-router-dom";
import NotificationOffcanvas from "./notificationOffcanvas";
import Badge from 'react-bootstrap/Badge';
import { requestForToken,onMessageListener, deleteTokens } from "../app/firebase";
const Blue = styled.div`
  color: #144399;
`;
export default function Common(props) {
  const appContext = useAppContext();
  let usertype = +localStorage.getItem("usertype");
  let connect = localStorage.getItem("connected");
  let networkId = localStorage.getItem("ChainId");
  let uName = localStorage.getItem("name");
  let status = +localStorage.getItem("status");
  const web3 = new Web3(window.ethereum);
  const [name, setName] = useState(uName);
  const [isChecked,setIsChecked] = useState(props.theme=== "dark") 
  const [show,setShow] = useState(false)
  const [isConnected, setIsConnected] = useState(connect);
  const [showButton, setShowButton] = useState(false);
  const [showRegisterButton, setShowRegisterButton] = useState(false);
  const [showPublicPatents, setShowPublicPatents] = useState(true);
  const [showAllPatents, setShowAllPatents] = useState(false);
  const [notificationCount, setNotificationCount] = useState(localStorage.getItem("notificationCount"));
  const [notificationList, setNotificationList] = useState([]);
  const base_url = process.env.REACT_APP_API_ENDPOINT;

  const navigate = useNavigate();
  useEffect(() => {
    if (usertype === 2 && status === 0) {
      setShowRegisterButton(true);
    }
    if (usertype === 2 && status === 1) {
      setShowButton(true);
      setShowAllPatents(false);
      getCountOfNotification();
    }
    if (usertype === 1) {
      setShowPublicPatents(false);
      setShowAllPatents(true);
    }
    if (connect === "false") {
     
      // connectWallet();
    }
    if (isConnected && networkId!=="0x5") {
     
      changeNetwork();
    }
    if(connect)
    requestForToken(appContext.getAxios());
  }, []);

  const toggleTheme = ()=>{

    setIsChecked(!isChecked)
    
  }
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", accountChanged);
      window.ethereum.on('chainChanged', (data) => {
        localStorage.setItem("ChainId", data);
        if(data!=="0x5"){
          logout();
        }
      })
       window.ethereum.request({method: 'eth_chainId',}).then((res) => {
        localStorage.setItem("ChainId", res);
      })
  
    }
  }, []);

  useEffect(() => {
    setName(uName)
  }, [localStorage.getItem("name")]);
  useEffect(()=>{
    
      props.themeChange(isChecked)
    
  },[isChecked])
  useEffect(()=>{
    if (props.theme === "dark") {
      setIsChecked(true)
    }
    else{
      setIsChecked(false)
    }
  },[props.theme])
  
  const accountChanged = async (accounts) => {
    deleteTokens()
    let theme = localStorage.getItem("theme")
    let address = localStorage.getItem("accountAddress")
    if (accounts[0] === undefined) {
      localStorage.clear();
      setIsConnected(false);
      setShowButton(false);
      setShowRegisterButton(false);
    } else if (address !== null && accounts[0] !== address) {
  
      localStorage.clear();
      setIsConnected(false);
      setShowButton(false);
      setShowRegisterButton(false);
      localStorage.setItem("accountAddress", accounts[0]);
      login(accounts[0]);
      navigate("/home")
      
    }
    localStorage.setItem("theme",theme)
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install metamask extension!!");
      window.open("https://metamask.io/download/", "_blank");
    }
     changeNetwork();
  };
  const connectMetamask = async () => {
   if (window.ethereum) {
    await window.ethereum.request({ method: "eth_requestAccounts" }).then((res) => {
       localStorage.setItem("accountAddress", res[0]);
       login(res[0]);
     });
    
     window.web3 = new Web3(window.ethereum);
     await window.ethereum.enable;
   } else {
     alert("Please install metamask extension!!");
     window.open("https://metamask.io/download/", "_blank");
   }
 };
  const login = async (address) => {
    try {
      const path = base_url + "auth";
      const body = {
        publicAddress: address,
      };

      await axios.post(path, body).then((response) => {
        if (response !== undefined) {
          handleSignMessage(response.data.publicAddress, response.data.nonce);
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignMessage = (publicAddress, nonce) => {
    return new Promise((resolve, reject) =>
      web3.eth.personal.sign(
        web3.utils.fromUtf8(`${nonce}`),
        publicAddress,
        (err, signature) => {
          if (err) {
            localStorage.removeItem("accountAddress");
            return reject(err);
          }
          sendSignature(publicAddress, signature);
          return resolve({ publicAddress, signature });
        }
      )
    );
  };

  const sendSignature = async (address, signature) => {
    try {
      appContext.sendSignature(address, signature).then((result) => {
        if (result.status === true) {
          window.ethereum.request({ method: 'eth_chainId',}).then((res) => {
           localStorage.setItem("ChainId", res);
         })
          let respData = result.info.data;
          setIsConnected(true);
          setName(respData.name);
          localStorage.setItem("name", respData.name);

          if (respData.usertype === 2 && respData.status === 0) {
            setShowRegisterButton(true);
            localStorage.setItem("name", respData.publicAddress);
            setName(respData.publicAddress);
            navigate("/registration");
          } 
          if (respData.usertype === 2 && respData.status === 1) {
            navigate("/mypatents");
            setShowButton(true);
            setShowAllPatents(false)
            setShowPublicPatents(true)
            requestForToken(appContext.getAxios());
            getCountOfNotification();
          }
          if (respData.usertype === 1) {
            setShowPublicPatents(false);
            setShowAllPatents(true);
            requestForToken(appContext.getAxios());
            navigate("/dashboard");
          }
        } else {
          localStorage.clear();
          setIsConnected(false);
          setShowButton(false);
          setShowRegisterButton(false);
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const logout = async () => {
    try {
      deleteTokens()
      let theme =localStorage.getItem("theme")
      localStorage.clear();
      localStorage.setItem("theme",theme)
      setIsConnected(false);
      setShowRegisterButton(false);
      setTimeout(() => {
        window.location = "/home";   
      }, 1000);
     
    } catch (error) {
      console.error(error);
    }
  };
  const profile = () => {
    navigate("/profile");
  };
  const viewNotification = () =>{
    getNotifications();
    setShow(true)
  }
  const handleClose = () =>{
    setShow(false)
  }

 const changeNetwork = async () => {
    try {
      await  window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x5' }],
      });
      connectMetamask();
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x5',
                chainName: 'Goerli Test Network',
                rpcUrls: ['https://goerli.infura.io/v3/']
              },
            ],
          });
          connectMetamask();
        } catch (addError) {
          console.error("Error",addError);
        }
      }
    }
  }
  onMessageListener().then(()=>{
    getCountOfNotification();
    // setNotificationCount(+localStorage.getItem("notificationCount"))
  })

  const getNotifications = async (e) => {
    let path = base_url + "users/me/notification";
    await appContext.getAxios().get(path).then((response) => {
      if (response !== undefined && response.status === 200) {
        setNotificationList(response.data.data);
      }
    }).catch(err => {
      console.log(err);
    })
  }

  const getCountOfNotification = async (e) => {
    let path = base_url + "users/me/notificationCount/0";
    await appContext.getAxios().get(path).then((response) => {
      if (response !== undefined && response.status === 200) {
        setNotificationCount(response.data.count);
      }
    }).catch(err => {
      console.log(err);
    })
  }
  return (
    <>
    <Navbar
      collapseOnSelect
      expand="lg"
      
      className="navBar"
      variant={isChecked?'dark':'light'}
      style={{ padding: "11px" }}
      sticky="top"
    >
      <Navbar.Brand as={Link} to="/home">
        <Blue>
          <i className="fa-solid fa-cubes"></i> BLOCKCHAIN
        </Blue>
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="me-auto">
          {showPublicPatents ? (
            <Nav.Link as={Link} to="/home">
              <Blue>Patents</Blue>
            </Nav.Link>
          ) : (
            ""
          )}
          {showRegisterButton ? (
            <Nav.Link as={Link} to="/registration">
              <Blue>Registration</Blue>
            </Nav.Link>
          ) : (
            ""
          )}
          {showButton ? (
            <>
            <Nav.Link as={Link} to="/mypatents">
              <Blue>My Patents</Blue>
            </Nav.Link>
            <Nav.Link as={Link} to="/mybids">
              <Blue>My Bids</Blue>
            </Nav.Link>
            </>
          ) : (
            ""
          )}
          {showAllPatents ? (
            <>
            <Nav.Link as={Link} to="/dashboard">
              <Blue>Dashboard</Blue>
            </Nav.Link>
            <Nav.Link as={Link} to="/patents">
              <Blue>All Patents</Blue>
            </Nav.Link>
            </>
            
          ) : (
            ""
          )}
        </Nav>
        <Nav className="navHead">
        {showButton?<button style={{backgroundColor:'transparent', borderColor:'transparent',paddingRight:"1em" }} onClick={viewNotification}>
            <div style={{textAlign:'left'}}>

       {!isChecked? <i className="fa-solid fa-bell" style={{color:"black",position:"relative"}}></i>:
       <i className="fa-solid fa-bell" style={{color:"white",position:"relative"}}></i>}
        {notificationCount>0 &&<Badge bg="danger" style={{position:"absolute",marginTop:"-1em"}}>{notificationCount}</Badge>}
      </div>
     
        </button>:""}
          
       
        <button style={{backgroundColor:'transparent', borderColor:'transparent' ,pointerEvents: 'none'}}>
            <div style={{pointerEvents:'auto',textAlign:'left'}}>
       {!isChecked? 
        <i className="fa-solid fa-moon" onClick={toggleTheme} style={{color:"black"}}></i>
      :<i className="fa-solid fa-sun" onClick={toggleTheme} style={{color:"white"}}></i>}
      </div>
  
        </button>


          {!isConnected ? (
            <Button style={{backgroundColor:'#144399'}}
              variant="primary"
              className="btn"
              onClick={connectWallet}
              disabled={isConnected}
            >
              Connect with metamask
            </Button>
          ) : (
            <NavDropdown
              title={
                <span>
                  <img
                    src={require("./images/images.jpg")}
                    style={{ width: "25px", height: "25px" }}
                    alt=""
                    width="32"
                    height="32"
                    className="rounded-circle me-2"
                  />

                  <span className="pro-name-2">{name}</span>
                </span>
              }
              id="navbarScrollingDropdown"
            >
             {showButton ? ( <NavDropdown.Item className="dropdown-menu-end" onClick={profile}>
                {" "}
                <i className="fas fa-user pe-2"></i>Profile
              </NavDropdown.Item> ) : (
            ""
          )}
              <NavDropdown.Item className="dropdown-menu-end" onClick={logout}>
                {" "}
                <i className="fas fa-sign-out-alt pe-2"></i>Disconnect
              </NavDropdown.Item>
            </NavDropdown>
          )}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
    <NotificationOffcanvas show={show} close={handleClose} list={notificationList} count={getCountOfNotification} placement="end"/>
    <Outlet />
    </>
  );
}
