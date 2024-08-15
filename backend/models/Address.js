const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    // other fields as necessary
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
