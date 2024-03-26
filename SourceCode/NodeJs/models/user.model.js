module.exports = mongoose => {
  let schema = mongoose.Schema(
      {
        _id: String,
        name:String,
        address:String,
        district:String,
        pincode:String,
        phoneNo:String,
        email:String,
        usertype:Number,
        deviceToken:{ type: String,default:''},

      },
      { timestamps: true }
    );
 
    const user = mongoose.model("user", schema);
    return user;
};
