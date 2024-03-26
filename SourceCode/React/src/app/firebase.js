import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage,deleteToken } from "firebase/messaging";
import { toast } from "react-toastify";
const base_url = process.env.REACT_APP_API_ENDPOINT;
const firebaseConfig = {
  apiKey: "AIzaSyAdjsCd-dOQHIdHCxYC4ikmAtdC8vNVX-A",
  authDomain: "testproject-e3650.firebaseapp.com",
  projectId: "testproject-e3650",
  storageBucket: "testproject-e3650.appspot.com",
  messagingSenderId: "335872678305",
  appId: "1:335872678305:web:61385d11bf6a445ae6d3e0",
  measurementId: "G-V6YN8Q4V7N"
};

initializeApp(firebaseConfig);
const messaging = getMessaging();

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("onmessage called", payload);
      const notificationTitle = payload.data.body;
       toast.info(notificationTitle);
      resolve(1);
    })
  });
  
export const deleteTokens=() =>{

    deleteToken(messaging).then((res=>{
      console.log(res,"Token deleted");
    }));

}

export const requestForToken = async (axios) => {
  const deviceToken=localStorage.getItem("FirebaseToken")
  await getToken(messaging, { vapidKey: 'BCRZL3uvyKF19QuLONg1fyg19x8mKaA6rX6fuSDEirPsiSrQxOUeuY7Bvd-rDzYLw6SYkP8aQw4mAbTGngSRF_c' })
    .then((firebaseToken) => {
      console.log("token", firebaseToken);
      if(deviceToken!==firebaseToken){
      localStorage.setItem("FirebaseToken",firebaseToken)
      sendNotificationToken(firebaseToken,axios);
      }
    })
    .catch((err) => {
      console.error("error",err);
    });
};

export const sendNotificationToken = async (firebaseToken,axios) => {
  let path=base_url + "users/me/notificationToken";
  let body = {
    deviceToken: firebaseToken
  }
  await axios
    .patch(path, body)
    .then((response) => {
      if (response !== undefined && response.status === 200) {
      }
    })
    .catch((err) => {
      console.log(err);
    });
};