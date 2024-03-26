module.exports = app => {
    const router = require("express").Router();
    const publicUser = require("../controllers/public.controller");
    router.get("/patent", publicUser.listPatent);
    router.get("/patent/:id", publicUser.findOne);
    app.use('/api/public', router);
};