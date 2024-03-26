module.exports = app => {
  const router = require("express").Router();
  const authenticate = require('../middlewares/authentication.middleware');
  const users = require("../controllers/user.controller.js");
  const userValidator = require('../validators/user-validator');
  router.post("", authenticate, userValidator.userValidator('registration'), users.createUser);
  router.get("/me", authenticate, users.profileView);
  router.put("/me", authenticate, userValidator.userValidator('updateUser'), users.profileupdate);
  router.put("/me/patents/:id", authenticate, userValidator.userValidator('updatePatent'), users.editPatents);
  router.get("/me/patents/:id", authenticate, users.findone);
  router.get("/me/patents", authenticate, users.listPatent);
  router.post("/me/patents", authenticate, userValidator.userValidator('createPatent'), users.createPatent);
  router.post("/me/patents/files", authenticate, users.uploadfiles);
  router.delete("/me/patents/files/:file", authenticate, users.deletefiles);
  router.post("/me/patents/comment/:id", userValidator.userValidator('comment'), authenticate, users.comment);
  router.patch("/me/patents/bid/:id", userValidator.userValidator('createBid'), authenticate, users.createBid);
  router.patch("/me/patents/paymentPending/:id", userValidator.userValidator('transactionHash'), authenticate, users.paymentPendingForPatent);
  router.patch("/me/patents/readyForSale/:id", userValidator.userValidator('readyForSale'), authenticate, users.readyForSale);
  router.patch("/me/notificationToken", authenticate, users.notificationToken);
  router.get("/me/notification", authenticate, users.listNotification);
  router.patch("/me/notification/:id", authenticate, users.updateNotificationStatus);
  router.get("/me/notificationCount/:status", authenticate, users.returnNotificationStatusCount);
  router.patch("/me/patents/checkFeePaymentStatus/:id", authenticate, users.checkFeeTransactionStatus);
  router.patch("/me/patents/approveBuyer/:id", authenticate, userValidator.userValidator('approveBuyer'), users.approveBuyer)
  router.patch("/me/patents/transferPending/:id", authenticate, userValidator.userValidator('transactionHash'), users.transferPending)
  router.patch("/me/patents/checkTransferTransactionStatus/:id", authenticate, users.checkTransferTransactionStatus)
  router.get("/me/patents/bid/list/:id", authenticate, users.bid_list);
  router.patch("/me/patents/checkExpiry/:id", authenticate, users.paymentExpiryCheck);

  app.use('/api/users', router);

};