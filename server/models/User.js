const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({

    name: {type: String, required: true, unique: false},
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v){
                return /^\S+@\S+\.\S+$/.test(v);
            },

            message: props => `${props.value} is not a valid email!!`,
        },
    },

    password: {type: String, require: true},

}, {timestamps: true});


const User = mongoose.model('User', userSchema);
module.exports = User;