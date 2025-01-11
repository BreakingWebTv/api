import mongoose from "mongoose";

const content = new mongoose.Schema({
    languageKey: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: false
    },
    title: {
        type: String,
        required: false
    },
    content: {
        type: String,
        required: false
    },
    shortContent: {
        type: String,
        required: false
    },
    information: {
        type: String,
        required: false
    },
    summary: {
        type: String,
        required: false
    },
});

export default mongoose.model('Post', new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    uniqueSlug: {
        type: String,
        required: false
    },
    uniqueTitle: {
        type: String,
        required: false
    },
    contents: [content],
    tags: [String],
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