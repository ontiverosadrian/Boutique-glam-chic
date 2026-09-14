const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "TU_URI_DE_MONGODB_ATLAS_AQUI";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado exitosamente a MongoDB Atlas'))
.catch(err => console.error('❌ Error al conectar a MongoDB Atlas:', err));

// Esquemas y Modelos
const productSchema = new mongoose.Schema({
    id: String,
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    description: String
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

// Rutas de Productos
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener los productos" });
    }
});

app.post('/api/admin/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (err) {
        res.status(500).json({ error: "Error al guardar el producto" });
    }
});

app.put('/api/admin/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        let updated = await Product.findByIdAndUpdate(productId, req.body, { new: true });
        if (!updated) {
            updated = await Product.findOneAndUpdate({ id: productId }, req.body, { new: true });
        }
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar el producto" });
    }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        let deleted = await Product.findByIdAndDelete(productId);
        if (!deleted) {
            deleted = await Product.findOneAndDelete({ id: productId });
        }
        res.json({ message: "Producto eliminado correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar el producto" });
    }
});

// Rutas de Autenticación
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "El correo ya está registrado" });
        }
        const newUser = new User({ name, email, password, role: role || 'client' });
        await newUser.save();
        res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (err) {
        console.error("Error en registro:", err);
        res.status(500).json({ error: "Error en el servidor al registrar" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase(), password: password.trim() });
        if (!user) {
            return res.status(400).json({ error: "Correo o contraseña incorrectos" });
        }
        res.json({ message: "Login exitoso", user });
    } catch (err) {
        console.error("Error crítico en login:", err);
        res.status(500).json({ error: "Error interno en el servidor al iniciar sesión" });
    }
});

// Rutas de Pedidos
app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (err) {
        console.error("Error al guardar pedido en MongoDB:", err);
        res.status(500).json({ error: "No se pudo guardar el pedido en la base de datos" });
    }
});

app.get('/api/orders/client/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const orders = await Order.find({ clientEmail: email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener los pedidos del cliente" });
    }
});

app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener los pedidos de administración" });
    }
});

app.put('/api/admin/orders/:id/status', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        
        let updated = null;
        if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
            updated = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
        }
        if (!updated) {
            updated = await Order.findOneAndUpdate({ _id: orderId }, { status }, { new: true });
        }

        res.json({ message: "Estatus actualizado", updated });
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar estatus" });
    }
});

app.delete('/api/admin/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        let deletedOrder = null;

        if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
            deletedOrder = await Order.findByIdAndDelete(orderId);
        }

        if (!deletedOrder) {
            deletedOrder = await Order.findOneAndDelete({ 
                $or: [{ _id: orderId }, { id: orderId }] 
            });
        }

        if (!deletedOrder) {
            return res.status(404).json({ error: "Pedido no encontrado en la base de datos" });
        }

        res.status(200).json({ message: "Pedido eliminado correctamente de MongoDB" });
    } catch (err) {
        console.error("Error al eliminar pedido en el servidor:", err);
        res.status(500).json({ error: "Error interno al eliminar el pedido" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});