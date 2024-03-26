import axios from 'axios'
import React, { useEffect } from 'react'
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const NO_OP = () => { };

const AppContext = React.createContext()
const useAppContext = () => React.useContext(AppContext)
const LOGIN_API = "auth"
const SEND_SIGNATURE = "auth/verify"

const basicContentType = { "Content-Type": "application/json" };
const AXIOS = axios.create({
  baseURL: process.env.REACT_APP_API_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
    get: basicContentType,
    post: basicContentType,
    put: basicContentType,
    delete: basicContentType,
    patch: basicContentType,
  },
});


AXIOS.interceptors.response.use(
  (response) => {
    return response;
  },
  function (error) {
    toast.error(error.response.data.message.error)
    return Promise.reject(error);
  }
);
axios.interceptors.response.use(

  (response) => {
    return response;
  },
  function (error) {
    toast.error(error.response.data.message.error)
    return Promise.reject(error);
  }
);

const AppContextProvider = ({ init, children }) => {
  const [auth, setAuth] = React.useState(init)
  useEffect(() => {
    if (auth !== null) {
      const time = 50000;
      const timeout = setTimeout(() => {
      }, time);

      return () => {
        clearTimeout(timeout);
      };
    }

    return NO_OP;
  }, [auth]);


  const sendSignature = (address, signature) => {
    const body = {
      publicAddress: address,
      signature: signature
    };

    return AXIOS.post(SEND_SIGNATURE, body).then(
      (response) => {
        setAuthorization(response.data.accessToken)
        localStorage.setItem("connected", true);
        localStorage.setItem("usertype", response.data.usertype);
        localStorage.setItem("refreshToken", response.data.refreshToken)
        localStorage.setItem("name", response.data.name)
        localStorage.setItem("accountAddress", address);
        localStorage.setItem("status", response.data.status);
        if(response.data.name===""){
          localStorage.setItem("name", address)
        }
        setAuth(response.data.accessToken)
        return { status: true, info: response };
      },
      (error) => {
        return { status: false, info: error }
      }
    )
  }
  const isLoggedIn = () => auth !== null
  const getUserType = () => localStorage.getItem("usertype")

  const getAccessToken = () => auth

  const getAxios = () => AXIOS

  const context = {
    sendSignature,
    isLoggedIn,
    getAccessToken,
    getAxios,
    getUserType
  }

  return (
    <AppContext.Provider value={context}>{children}</AppContext.Provider>
  )
}

function refreshAccessToken() {

  let refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken === null) {
    return Promise.resolve(null);
  }
  let body = {
    'refreshToken': refreshToken
  }
  return AXIOS.put(LOGIN_API, body, {
    headers: {
      authorization: null,
    },
  }).then(
    (response) => {
      setAuthorization(response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem("accessToken", JSON.stringify(response.data.accessToken));

      return response.data.accessToken;
    },
    (error) => {
      localStorage.clear()
      window.location.href = '/home';
      return Promise.reject(error);

    }
  );
}

const setAuthorization = (accessToken) => {
  localStorage.setItem("accessToken", accessToken);
  AXIOS.defaults.headers.common["authorization"] = AXIOS.defaults.headers.get[
    "authorization"
  ] = AXIOS.defaults.headers.post["authorization"] = AXIOS.defaults.headers.put[
  "authorization"
  ] = AXIOS.defaults.headers.delete[
  "authorization"
  ] = AXIOS.defaults.headers.patch["authorization"] =
  "PATENT " + accessToken;

  setTimeout(() => {
    refreshAccessToken(localStorage.getItem('refreshToken'))
  }, 540000);
}


export default useAppContext;
export { refreshAccessToken, AppContextProvider }