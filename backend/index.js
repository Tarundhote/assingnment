import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import projectRoutes from './Routes/project.route.js';
import clientRoutes from './Routes/client.route.js';
import contactRoutes from './Routes/contact.route.js';
import subsriptionRoutes from './Routes/subscribed.route.js';
import adminRoutes from './Routes/admin.route.js';
import fileUpload from "express-fileupload";
import { v2 as cloudinary } from 'cloudinary';
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;
const DB_URI = process.env.MONGO_URI;

if (!DB_URI) {
    console.warn("MONGO_URI is not set. The server will run without a MongoDB connection.");
    console.warn("To connect to MongoDB, create a `.env` file in the backend folder with:");
    console.warn("MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority");
}

app.use(express.json());

app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    
}))

app.use('/api/v1/project', projectRoutes);
app.use('/api/v1/client', clientRoutes);
app.use('/api/v1/user', contactRoutes);
app.use('/api/v1/subscriptions', subsriptionRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!')
});

//Cloudinary Configuration
 cloudinary.config({ 
    cloud_name: process.env.cloud_name, 
    api_key: process.env.api_key, 
    api_secret: process.env.api_secret 
});

let dbConnected = false;

async function connectWithUri(uri) {
    if (!uri) return false;
    try {
        await mongoose.connect(uri, { connectTimeoutMS: 10000 });
        console.log("Connected to MongoDB:", uri.startsWith('mongodb+srv://') ? '(atlas)' : uri);
        return true;
    } catch (error) {
        if (error && (error.code === 'ENOTFOUND' || (error.message && error.message.includes('ENOTFOUND')))) {
            console.error("DNS lookup failed for MongoDB host. Check your MONGO_URI hostname and network/DNS settings.");
            console.error("Original error:", error.message || error);
        } else {
            console.error("MongoDB connection failed:", error.message || error);
        }
        return false;
    }
}

if (DB_URI) {
    dbConnected = await connectWithUri(DB_URI);
}

if (!dbConnected) {
    const localUri = 'mongodb://127.0.0.1:27017/real-trust';
    console.warn('Attempting fallback to local MongoDB:', localUri);
    dbConnected = await connectWithUri(localUri);
}

if (!dbConnected) {
    console.error('Could not connect to any MongoDB instance. Server will start but database operations will fail fast.');
    mongoose.set('bufferCommands', false);
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
