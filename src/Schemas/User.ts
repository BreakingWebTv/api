import mongoose from 'mongoose';

const connection = new mongoose.Schema({
    source: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: false
    },
    username: {
        type: String,
        required: false
    },
    avatar: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    accessToken: {
        type: String,
        required: false
    },
    refreshToken: {
        type: String,
        required: false
    },
    expires: {
        type: Number,
        required: false
    },
});

export default mongoose.model('User', new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        default: null,
        required: false
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    connections: [connection],
    permissions: {
        type: Array,
        default: [],
        required: false
    },
    twoFASecret: {
        type: String,
        default: null,
        required: false
    },
    newsLetter: {
        type: Boolean,
        default: false,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
}));