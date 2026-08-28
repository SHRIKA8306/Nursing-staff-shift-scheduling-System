const mongoose = require('mongoose');

module.exports = async () => {
    const url = process.env.DB || 'mongodb://127.0.0.1:27017/nurse_shift_db';

    // Catch runtime mongoose connection errors to prevent server crash
    mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB runtime error:', err.message);
    });

    try {
        await mongoose.connect(url, {
            serverSelectionTimeoutMS: 5000 // 5 seconds timeout before fallback
        });
        console.log("✅ Successfully connected to MongoDB database");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        console.log("💡 Tip: If using MongoDB Atlas, verify your username/password in Backend/.env. Or run local MongoDB at mongodb://127.0.0.1:27017/nurse_shift_db.");
    }
};