const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Conexión a MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://adminpedidos:Adri2211@sistemapedidos.ixivn0x.mongodb.net/glam-chic?appName=SistemaPedidos";

mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado exitosamente a MongoDB Atlas (glam-chic)'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

// Modelos de Mongoose
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String }
});
const Product = mongoose.model('Product', productSchema);

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'client' }
});
const User = mongoose.model('User', userSchema);

const orderSchema = new mongoose.Schema({
    clientEmail: { type: String, required: true },
    clientName: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    clientPhone: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    items: { type: Array, required: true },
    total: { type: Number, required: true },
    status: { type: String, default: 'Pendiente' },
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// Modelo de Anuncios y Videos Publicitarios
const bannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String },
    badge: { type: String, default: '✨ Promoción Especial' },
    videoUrl: { type: String },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
const Banner = mongoose.model('Banner', bannerSchema);

// Rutas API - Productos
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

app.post('/api/admin/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: 'Error al guardar producto' });
    }
});

app.put('/api/admin/products/:id', async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Producto eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// Rutas API - Autenticación
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'El correo ya está registrado.' });

        const newUser = new User({ name, email, password, role: role || 'client' });
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado con éxito', user: newUser });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor al registrar' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        res.json({ message: 'Login exitoso', user });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
    }
});

// Rutas API - Pedidos
app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar pedido' });
    }
});

app.get('/api/orders/client/:email', async (req, res) => {
    try {
        const orders = await Order.find({ clientEmail: req.params.email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pedidos del cliente' });
    }
});

app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pedidos de administración' });
    }
});

app.put('/api/admin/orders/:id/status', async (req, res) => {
    try {
        const updated = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar estatus' });
    }
});

app.delete('/api/admin/orders/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Pedido eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar pedido' });
    }
});

// Rutas API - Anuncios y Videos Publicitarios
app.get('/api/banner', async (req, res) => {
    try {
        let banner = await Banner.findOne({ active: true }).sort({ createdAt: -1 });
        if (!banner) {
            banner = {
                title: '¡Colección Glam Chic 2026!',
                subtitle: 'Descubre las últimas tendencias en vestidos y accesorios exclusivos.',
                badge: '✨ Temporada Exclusiva',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
            };
        }
        res.json(banner);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener el banner publicitario' });
    }
});

app.post('/api/admin/banner', async (req, res) => {
    try {
        await Banner.updateMany({}, { active: false });
        const newBanner = new Banner(req.body);
        await newBanner.save();
        res.status(201).json(newBanner);
    } catch (err) {
        res.status(500).json({ error: 'Error al guardar el banner' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));