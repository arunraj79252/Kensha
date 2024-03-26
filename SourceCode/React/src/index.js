import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/common.css";
import { AppContextProvider, refreshAccessToken } from './AppContext';
import "primereact/resources/primereact.min.css";                  //core css
import "primeicons/primeicons.css";

const root = ReactDOM.createRoot(document.getElementById('root'));
refreshAccessToken().then((value) =>
    root.render(
        <AppContextProvider init={value}>
            <App ></App>
        </AppContextProvider>


    ));
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
