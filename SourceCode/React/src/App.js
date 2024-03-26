
import React, { useEffect, useState } from "react";
import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import Common from "./app/common";
import { ToastContainer } from "react-toastify";
import PatentDetails from "./app/patentDetails";
import Home from "./app/home";
import MyPatents from "./app/patentList/myPatents";
import AllPatents from "./app/patentList/allPatents";
import "primeicons/primeicons.css";
import Registration from "./app/registration";
import ProfileDetails from "./app/profileDetails";
import PatentDetailsUser from "./app/patentDetailsUser";
import PatentDetailsAdmin from "./app/patentDetailsAdmin";
import NotFound from "./app/NotFound";
import { AdminProtected, UserProtected } from "./app/protected";
import Dashboard from "./app/dashboard/dashboard";
import MyBids from "./app/myBids";
function App() {
  
  const [theme,setTheme] = useState(localStorage.getItem("theme"))

 
  const themeChange = (color) =>{
    if (color) {
      setTheme('dark')
    }
    else{
      setTheme('light')
      localStorage.setItem("theme","light")
     
    }
  }
  useEffect(()=>{
    
    if (theme ==="dark") {
      localStorage.setItem("theme","dark")
      document.body.style.backgroundColor="  #373747"
      document.body.style.color="white"
    } else {
      document.body.style.backgroundColor="white"
      document.body.style.color="#858796"
    }
  },[theme])


  useEffect(()=>{
     const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    if (darkThemeMq.matches ||localStorage.getItem("theme")==="dark") {

      setTheme("dark")
      localStorage.setItem("theme","dark")
    } else {
      setTheme("light")
      localStorage.setItem("theme","light")
    }
    window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', event => {
      const colorScheme = event.matches ? "dark" : "light";
      setTheme(colorScheme)
    });
  },[])
  return (
    <>
      <div>
        <main className={theme}>
          <div style={{ paddingRight: 15, paddingLeft: 15 }} ></div>
        
          <BrowserRouter>

            <Routes >
              <Route path="/" element={<Common theme={theme} themeChange={themeChange} />}>
                <Route path="home" element={<Home />} > </Route>
                <Route path="/" element={<Navigate replace to="home" />} ></Route>
                <Route path="mypatents" element={<UserProtected ><MyPatents theme ={theme} /></UserProtected>} > </Route>
                <Route path="/patents" element={<AdminProtected ><AllPatents /></AdminProtected>} > </Route>
                <Route path="/registration" element={<UserProtected ><Registration /></UserProtected>} > </Route>
                <Route path="/patentDetails/:id" element={<PatentDetails />} > </Route>
                <Route path="/patentD/:id" element={<UserProtected ><PatentDetailsUser /></UserProtected>} > </Route>
                <Route path="/details/:id" element={<AdminProtected ><PatentDetailsAdmin /></AdminProtected>} > </Route>
                <Route path="/profile" element={<UserProtected ><ProfileDetails /></UserProtected>} > </Route>
                <Route path="/mybids" element={<UserProtected ><MyBids /></UserProtected>} > </Route>
                <Route path="/dashboard" element={<AdminProtected ><Dashboard  theme ={theme}/></AdminProtected>} > </Route>

              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </main>
      </div>
      <ToastContainer
        autoClose={1500}
        hideProgressBar
        closeButton={true}
        position="top-right"
      />
    </>
  );
}

export default App;
