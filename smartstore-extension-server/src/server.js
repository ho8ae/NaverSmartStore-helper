const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const AuthController = require('./controllers/auth.controller');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS policy violation'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Auth routes
app.post('/api/auth/token', (req, res) => AuthController.getToken(req, res));
app.post('/api/auth/validate', (req, res) => AuthController.validateCredentials(req, res));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});