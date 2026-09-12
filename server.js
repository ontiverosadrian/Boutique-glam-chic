const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Importar SDK de Mercado Pago
const { MercadoPagoConfig, Preference } = require('mercadopago');

// Configurar credenciales con tu Access Token de prueba de Mercado Pago
const client = new MercadoPagoConfig({ accessToken: 'TEST-3392471900115396-051512-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' });

const app = express();
app.use(express.json());
app.use(cors());

// Conexión directa a MongoDB Atlas (Base de datos: boquite)
const MONGO_URI = "mongodb+srv://adminpedidos:Adri2211@sistemapedidos.ixivn0x.mongodb.net/boquite?retryWrites=true&w=majority&appName=SistemaPedidos";

mongoose.connect(MONGO_URI)
    .then(() => console.log('¡Conectado exitosamente a MongoDB Atlas (Base de datos: boquite)!'))
    .catch(err => console.error('Error al conectar con MongoDB:', err));

// Esquemas y Modelos
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['client', 'admin'], default: 'client' }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String }
}, { timestamps: true });
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
    clientEmail: { type: String, required: true },
    clientName: { type: String },
    shippingAddress: { type: String, required: true },
    clientPhone: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    items: [{ id: String, name: String, price: Number, quantity: Number }],
    total: { type: Number, required: true },
    status: { type: String, enum: ['Pendiente', 'En proceso', 'Entregado'], default: 'Pendiente' }
}, { timestamps: true });
const Order = mongoose.model('Order', orderSchema);

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        const newUser = new User({ name, email, password, role: role || 'client' });
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor al registrar usuario.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: 'Credenciales inválidas.' });
        res.json({ message: 'Inicio de sesión exitoso', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión.' });
    }
});

// --- RUTAS DE PRODUCTOS ---
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener productos.' });
    }
});

app.post('/api/admin/products', async (req, res) => {
    try {
        const { name, category, price, image, description } = req.body;
        const newProduct = new Product({ name, category, price, image, description });
        await newProduct.save();
        res.status(201).json({ message: 'Producto creado', product: newProduct });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear producto.' });
    }
});

app.put('/api/admin/products/:id', async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: 'Actualizado', product: updated });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar.' });
    }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar.' });
    }
});

// --- RUTA DE PAGO CON MERCADO PAGO ---
app.post('/api/create-mercadopago-preference', async (req, res) => {
    try {
        const { items, clientEmail, clientName, shippingAddress, clientPhone } = req.body;

        // Mapear los artículos al formato de preferencia de Mercado Pago
        const preferenceItems = items.map(item => ({
            title: item.name,
            quantity: Number(item.quantity),
            unit_price: Number(item.price),
            currency_id: 'MXN'
        }));

        const preference = new Preference(client);
        const response = await preference.create({
            body: {
                items: preferenceItems,
                back_urls: {
                    success: 'http://localhost:5500/index.html?payment=success',
                    failure: 'http://localhost:5500/index.html?payment=cancelled',
                    pending: 'http://localhost:5500/index.html?payment=pending'
                },
                auto_return: 'approved',
                payer: {
                    email: clientEmail,
                    name: clientName
                },
                statement_descriptor: 'GLAM CHIC'
            }
        });

        // Retornar la URL de inicio de pago (sandbox_init_point para pruebas)
        res.json({ url: response.sandbox_init_point || response.init_point });
    } catch (err) {
        console.error('Error al crear preferencia en Mercado Pago:', err);
        res.status(500).json({ error: 'Error al procesar el pago con Mercado Pago.' });
    }
});

// --- CREAR PEDIDO DIRECTO (Efectivo / Transferencia) ---
app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json({ message: 'Pedido registrado con éxito', orderId: newOrder._id });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar pedido.' });
    }
});

app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener pedidos.' });
    }
});

app.get('/api/orders/client/:email', async (req, res) => {
    try {
        const orders = await Order.find({ clientEmail: req.params.email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener historial.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});