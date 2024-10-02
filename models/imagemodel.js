import mongoose from "mongoose";
const { Schema } = mongoose;

const imageschema = new Schema({
    title: String,
    imageurl: String,
    public_id: String
});

const ImageModel = mongoose.model('Image', imageschema);

export default ImageModel;
