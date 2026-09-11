const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Idealmente hasheada con bcrypt
    role: { type: String, enum: ['client', 'admin'], default: 'client' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);