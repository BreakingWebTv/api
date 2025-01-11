import mongoose from "mongoose";

const name = new mongoose.Schema({
    languageKey: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: false
    }
});

export default mongoose.model('Tag', new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    uniqueName: {
        type: String,
        required: false
    },
    names: [name],
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