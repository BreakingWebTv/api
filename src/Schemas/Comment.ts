import mongoose from "mongoose";

export default mongoose.model('Comment', new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    postId: {
        type: String,
        required: false
    },
    content: {
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