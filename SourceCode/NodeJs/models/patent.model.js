const transfer = require('../utils/transfer-status.utils');

module.exports = mongoose => {

  const schema = mongoose.Schema(
    {
      patentName: String,
      publicAddress: String,
      description: String,
      s3Address: Array,
      feesTxHash: String,
      mintTxHash: String,
      transferTxHash: String,
      statusLog: [{ status: Number, message: String, statusDate: { type: Date, default: Date.now } }],
      message: [{ message: String, user: String, userPublicaddress: String, statusDate: { type: Date, default: Date.now } }],
      status: Number,
      _id: Number,
      transferStatus: { type: Number, default: transfer.notForSale },
      baseAmount: { type: Number, default: 0 },
      transferLog: [{ seller: String, buyer: String, transferDate: { type: Date, default: Date.now } }],
      bidLog: [{ userName: String, userPublicAddress: String, amount: Number, bidDate: { type: Date, default: Date.now } }],
      approvedBuyer: String,
      approvedPrice: String,
      payment_expiry_date: Date
    },
    { timestamps: true }
  );
  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });
  const patent = mongoose.model("patent", schema);
  return patent;
};
