const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    clientEmail: { type: String, required: true },
    clientName: { type: String },
    items: [
        {
            id: Number,
            name: String,
            price: Number,
            quantity: Number
        }
    ],
    total: { type: Number, required: true },
    status: { type: String, enum: ['Pendiente', 'En proceso', 'Entregado'], default: 'Pendiente' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);