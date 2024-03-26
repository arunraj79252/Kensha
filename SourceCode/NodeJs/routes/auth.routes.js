const router = require("express").Router();
const auth = require("../controllers/auth.controller.js");
const authValidator = require('../validators/auth-validators');

module.exports = app => {
    //login first check
    router.post("/auth", authValidator.authValidator('login'), auth.login);
    router.put("/auth", authValidator.authValidator('refreshToken'), auth.refreshToken);
    router.post("/auth/verify",authValidator.authValidator('sign'), auth.verifySign);
    app.use('/api', router);
   
}