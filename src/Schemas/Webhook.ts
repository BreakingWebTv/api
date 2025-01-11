import mongoose from "mongoose";

export default mongoose.model('Webhook', new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: false
    },
    secret: {
        type: String,
        required: false
    },
    creatorId: {
        type: String,
        default: null,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
}));