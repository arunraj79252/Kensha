import React from 'react'
import { Navigate } from "react-router-dom";
const AdminProtected = ({ children }) => {
    let usertype = +localStorage.getItem("usertype");
    if (usertype !== 1) {
        return <Navigate to="/" replace />;
    }
    return children;
}
const UserProtected = ({ children }) => {
    let usertype = +localStorage.getItem("usertype");
    if (usertype !== 2) {
        return <Navigate to="/patents" replace />;
    }
    return children;
}
export { AdminProtected, UserProtected };
