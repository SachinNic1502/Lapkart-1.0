const express = require('express');
const cors = require('cors');
const connectDB = require('./db/db');
const cookieParser = require('cookie-parser');
const userRouter = require('./routes/userRoutes');
const addressRouter = require('./routes/addressRoutes');
const authRouter = require('./routes/authRoutes');
const productRouter = require('./routes/productRoutes');
const categoryRouter = require('./routes/categoryRoutes');
const cartRouter =require('./routes/cartRouter');
const emiRouter =require('./routes/emiRoutes')
const orderRouter = require('./routes/ourderRoutes');
// const paymentRouter = require('./routes/paymentRoutes');
const ordersRoute = require('./routes/ordersRoutes');
const paymentsRoute = require('./routes/paymentsRoutes');
const shippingRoute = require('./routes/shippingRoutes');

const sellerRoute= require('./routes/sellerRoutes');

const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cookieParser());
// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api', userRouter);
app.use('/api/products', productRouter);
app.use('/api', categoryRouter);
app.use('/api/addresses', addressRouter);
app.use('/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/emi', emiRouter);
// app.use('/api', orderRouter);
// app.use('/api/payments', paymentRouter);
app.use('/api/orders', ordersRoute);
app.use('/api/payments', paymentsRoute);
app.use('/api/shipping', shippingRoute);
app.use('/api/sellers', sellerRoute);




// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

