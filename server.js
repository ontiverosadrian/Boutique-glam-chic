const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexión a MongoDB Atlas (utiliza tu variable de entorno en Render)
const MONGO_URI = process.env.MONGO_URI || 'tu_uri_de_mongodb_aqui';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Conectado a MongoDB Atlas'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// --- ESQUEMAS Y MODELOS ---
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'client' } // 'client' o 'admin'
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    price: Number,
    image: String,
    description: String,
    available: { type: Boolean, default: true }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
    clientEmail: String,
    clientName: String,
    shippingAddress: String,
    clientPhone: String,
    paymentMethod: String,
    items: Array,
    total: Number,
    status: { type: String, default: 'Pendiente' }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

const bannerSchema = new mongoose.Schema({
    title: String,
    badge: String,
    subtitle: String,
    videoUrl: String
}, { timestamps: true });

const Banner = mongoose.model('Banner', bannerSchema);

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'El correo ya está registrado.' });

        const userRole = role || (email.includes('admin') ? 'admin' : 'client');
        const newUser = new User({ name, email, password, role: userRole });
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado con éxito', user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor al registrar' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(400).json({ error: 'Correo o contraseña incorrectos.' });
        res.json({ message: 'Login exitoso', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
    }
});

// --- RUTAS DE ADMINISTRACIÓN DE USUARIOS ---
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

app.put('/api/admin/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { role }, 
            { new: true, select: '-password' }
        );
        if (!updatedUser) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el rol' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
});

// --- RUTAS DE PRODUCTOS ---
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
        res.status(500).json({ error: 'Error al crear producto' });
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

// --- RUTAS DE PEDIDOS ---
app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(500).json({ error: 'Error al crear pedido' });
    }
});

app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pedidos' });
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

// --- RUTAS DE BANNER ---
app.get('/api/banner', async (req, res) => {
    try {
        const banner = await Banner.findOne().sort({ createdAt: -1 });
        res.json(banner || {});
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener banner' });
    }
});

app.post('/api/admin/banner', async (req, res) => {
    try {
        await Banner.deleteMany({});
        const newBanner = new Banner(req.body);
        await newBanner.save();
        res.json(newBanner);
    } catch (err) {
        res.status(500).json({ error: 'Error al guardar banner' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));