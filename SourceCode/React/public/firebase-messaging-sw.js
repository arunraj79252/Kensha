importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js");

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: "AIzaSyAdjsCd-dOQHIdHCxYC4ikmAtdC8vNVX-A",

  authDomain: "testproject-e3650.firebaseapp.com",

  projectId: "testproject-e3650",

  storageBucket: "testproject-e3650.appspot.com",

  messagingSenderId: "335872678305",

  appId: "1:335872678305:web:61385d11bf6a445ae6d3e0",

  measurementId: "G-V6YN8Q4V7N"
  };

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  let url =""
  
  messaging.onBackgroundMessage(function(payload) {
    url = payload.data.click_action
    const notificationTitle = payload.data.title;
      const notificationOptions = {
        body: payload.data.body,
        icon: '/firebase-logo.png'
      };
     return self.registration.showNotification(notificationTitle,
      notificationOptions);
  });

  self.addEventListener('notificationclick', event => {
    clients.openWindow("https://blockchain-test.innovaturelabs.com"+url)
    return event;
  });