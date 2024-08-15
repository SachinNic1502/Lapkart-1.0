const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new mongoose.Schema({
    houseNumber: String,
    buildingName: String,
    streetName: String,
    locality: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    profileImg: {
        type: String, 
        default: null
    },
    modified: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    },
    addresses: [addressSchema]
}, {
    timestamps: true 
});

const User = mongoose.model('User', userSchema);

module.exports = User;
