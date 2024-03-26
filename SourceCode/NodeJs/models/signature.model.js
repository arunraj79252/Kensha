module.exports = mongoose => {
  let schema = mongoose.Schema(
    {
      publicAddress: String,
      nonce: Number,
      expire_at: { type: Date, default: Date.now, expires: 60 }

    },
    { timestamps: true }
  );
  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });
  const signature = mongoose.model("signature", schema);
  return signature;
};
