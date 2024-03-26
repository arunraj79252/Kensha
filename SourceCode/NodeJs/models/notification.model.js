module.exports = mongoose => {
    const schema = mongoose.Schema(
        {
            _id: Number,
            patentId: Number,
            publicAddress: String,
            title: String,
            body: String,
            deviceToken:String,
            status:{ type: Number, default: 0},
            click_action:String

        },
        { timestamps: true }
    );
    schema.method("toJSON", function () {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });
    const notification = mongoose.model("notification", schema);
    return notification;
};
