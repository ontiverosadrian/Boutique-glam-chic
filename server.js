const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Enlace de conexión oficial configurado con la base de datos "boquite"
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://adminpedidos:Adri2211@sistemapedidos.ixivn0x.mongodb.net/boquite?retryWrites=true&w=majority&appName=SistemaPedidos";

mongoose.connect(MONGO_URI)
    .then(() => console.log('¡Conectado exitosamente a MongoDB Atlas (Base de datos: boquite)!'))
    .catch(err => console.error('Error al conectar con MongoDB:', err));

// Esquema y Modelo de Usuario
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['client', 'admin'], default: 'client' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Esquema y Modelo de Pedido
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

const Order = mongoose.model('Order', orderSchema);

// --- RUTAS DE AUTENTICACIÓN ---

// Registro de usuarios
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });

        const newUser = new User({ name, email, password, role: role || 'client' });
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (err) {
        console.error('Error en registro:', err);
        res.status(500).json({ error: 'Error en el servidor al registrar usuario.' });
    }
});

// Inicio de sesión
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: 'Credenciales inválidas. Verifica tu correo y contraseña.' });

        res.json({
            message: 'Inicio de sesión exitoso',
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión.' });
    }
});

// --- RUTAS DE PEDIDOS ---

// Crear un nuevo pedido (Cliente)
app.post('/api/orders', async (req, res) => {
    try {
        const { clientEmail, clientName, items, total } = req.body;
        const newOrder = new Order({ clientEmail, clientName, items, total });
        await newOrder.save();
        res.status(201).json({ message: 'Pedido registrado con éxito', orderId: newOrder._id });
    } catch (err) {
        console.error('Error al guardar pedido:', err);
        res.status(500).json({ error: 'Error al registrar el pedido.' });
    }
});

// Ver todos los pedidos (Exclusivo Administrador)
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('Error al obtener pedidos:', err);
        res.status(500).json({ error: 'Error al obtener la lista de pedidos.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});