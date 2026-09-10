const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors()); // Permite conectar tu PWA con el servidor

// Conexión a MongoDB Atlas (usando la variable de entorno)
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado exitosamente a MongoDB Atlas'))
.catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

// Definir el Esquema y Modelo del Pedido
const orderSchema = new mongoose.Schema({
    items: [
        {
            id: Number,
            name: String,
            price: Number,
            quantity: Number
        }
    ],
    total: Number,
    date: { type: Date, default: Date.now },
    status: { type: String, default: 'Pendiente de Sincronización' }
});

const Order = mongoose.model('Order', orderSchema);

// Ruta (Endpoint) para recibir y guardar pedidos desde la PWA
app.post('/api/orders', async (req, res) => {
    try {
        const { items, total } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'El pedido está vacío' });
        }

        const newOrder = new Order({
            items,
            total,
            status: 'Recibido en Servidor'
        });

        await newOrder.save();
        res.status(201).json({ message: '¡Pedido guardado en MongoDB con éxito!', orderId: newOrder._id });
    } catch (error) {
        console.error('Error al guardar el pedido:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});