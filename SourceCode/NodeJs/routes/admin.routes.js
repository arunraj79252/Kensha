const admin = require("../controllers/admin.controller.js");
const router = require("express").Router();
const authenticate = require('../middlewares/authentication.middleware');
const permit = require('../middlewares/authorization.middleware');
const { Authority } = require('../utils/user-roles.utils');
const adminValidator = require('../validators/admin-validators');
module.exports = app => {
    router.get("/patents", authenticate, permit(Authority), admin.listPatent);
    router.get("/patents/:id", authenticate, permit(Authority), admin.findOne);
    router.patch("/patents/reject/:id", authenticate, permit(Authority), adminValidator.adminValidator('messageValidate'), admin.rejectPatent);
    router.patch("/patents/review/:id", authenticate, permit(Authority), admin.reviewPatent);
    router.patch("/patents/readyToApprove/:id", authenticate, permit(Authority), admin.readyToApprovePatent);
    router.post("/patents/comment/:id", adminValidator.adminValidator('comment'), authenticate, admin.comment);
    router.get("/statistics", authenticate, permit(Authority), admin.statistics);
    router.get("/statistics/user", authenticate, permit(Authority), admin.getUserAnalytics);
    router.get("/statistics/patents", authenticate, permit(Authority), admin.getPatentAnalytics);
    router.get("/statistics/patents/daily", authenticate, permit(Authority), admin.patentAnalytics_week);
    
    app.use('/api/admin', router);

}