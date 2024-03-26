import React, { useEffect } from "react";

export default function NotFound() {
  // const [IsloggedIn, setIsloggedIn] = useState(false);

  useEffect(() => {
    // if (
    //   localStorage.getItem("refreshToken") === null ||
    //   localStorage.getItem("refreshToken") === ""
    // ) {
    //   setIsloggedIn(false);

    //   return false;
    // } else {
    //   setIsloggedIn(true);
    //   return true;
    // }
  }, []);
  return (
    <div className="container">
      <div className="d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h1 className="display-1 fw-bold">404</h1>
          <p className="fs-3"> <span className="text-danger">Oops!</span> Page not found.</p>
          <p className="lead">
            The page you’re looking for doesn’t exist.
          </p>
          <a href="/home" className="btn btn-primary">Go Home</a>
        </div>
      </div>
    </div>
  );
}
