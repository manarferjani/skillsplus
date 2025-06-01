import dotenv from 'dotenv';
dotenv.config();
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './config/swagger.js';
import mongoose from 'mongoose';
import './cronTask.js';
import http from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import cookieParser from 'cookie-parser';

// Préparer le changement dans Mongoose 7
mongoose.set('strictQuery', false);

// Connexion à la base de données
import { connectDB } from './config/connect.js';
connectDB();

const app = express();

// Middleware globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration multer pour upload fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'Uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});
app.set('io', io);

// Middleware parsing : sauf sur /upload (géré par multer)
app.use((req, res, next) => {
  if (req.path === '/upload') return next();
  express.json()(req, res, () => {
    express.urlencoded({ extended: true })(req, res, next);
  });
});

// Route upload utilisant multer
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Fichier manquant' });
  }

  const { conversationId, senderId, messageType } = req.body;

  return res.json({
    message: 'Upload OK',
    file: req.file.filename,
    conversationId,
    senderId,
    messageType,
  });
});

// Dossier statique pour fichiers uploadés
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

app.use(cookieParser());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { explorer: true }));

// Import des middlewares d'authentification
import { auth, isAdmin, isManager } from './middleware/auth.js';

// Importation des routes
import authRoutes from './controllers/auth.controller.js';
import userRoutes from './controllers/user.controller.js';
import collaboratorRoutes from './controllers/collaborator.controller.js';
import testRoutes from './controllers/test.controller.js';
import technologieRoutes from './controllers/technology.controller.js';
import submissionRoutes from './controllers/submission.controller.js';
import performerRoutes from './controllers/performer.controller.js';
import courseRoutes from './controllers/course.controller.js';
import chatRoutes from './controllers/chat.controller.js';
import messageRoutes from './controllers/message.controller.js';
import preferenceRouter from './controllers/preference.controller.js';
// Test email configuration on startup
(async () => {
  try {
    const isEmailConfigValid = await testEmailConfiguration();
    if (!isEmailConfigValid) {
      console.error('Email configuration is invalid. Please check your SMTP settings.');
    } else {
      console.log('Email configuration verified successfully.');
    }
  } catch (error) {
    console.error('Error checking email configuration:', error.message);
  }
})();

// Socket.IO - gestion des connexions
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Client ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('offer', ({ conversationId, offer }) => {
    socket.to(conversationId).emit('offer', { offer });
  });

  socket.on('answer', ({ conversationId, answer }) => {
    socket.to(conversationId).emit('answer', { answer });
  });

  socket.on('ice-candidate', ({ conversationId, candidate }) => {
    socket.to(conversationId).emit('ice-candidate', { candidate });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    name: 'SkillsPlus API',
    version: '1.0.0',
    description: 'Backend API for SkillsPlus application',
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    endpoints: {
      auth: '/api/auth',
      user: '/api/users',
      test: '/api/test',
    },
    environments: {
      development: 'http://localhost:5000',
      production: process.env.PRODUCTION_URL || 'Not configured',
    },
    authKeys: {
      'CLERK_PUBLISHABLE_KEY': process.env.CLERK_PUBLISHABLE_KEY ? 'Configured' : 'Not configured',
      'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY ? 'Configured' : 'Not configured',
      'JWT_SECRET': process.env.JWT_SECRET ? 'Configured' : 'Not configured',
    },
  });
});

// MongoDB status endpoint
app.get('/api/db/status', (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const connected = state === 1;
    const dbName = mongoose.connection.name || 'No database name available';
    const dbHost = mongoose.connection.host || 'No host information available';
    const dbPort = mongoose.connection.port || 'No port information available';
    let collections = [];
    if (connected) {
      try {
        collections = Object.keys(mongoose.connection.collections);
      } catch (err) {
        console.error('Error getting collections:', err);
      }
    }

    res.json({
      success: true,
      connected,
      message: connected ? 'Database connection is valid' : `Database is ${states[state]}`,
      status: state,
      statusText: states[state],
      database: process.env.MONGODB_URI ? `${process.env.MONGODB_URI.split('@')[1]}` : 'No connection string available',
      details: {
        name: dbName,
        host: dbHost,
        port: dbPort,
        collections: collections.length > 0 ? collections : 'No collections info available',
      },
    });
  } catch (error) {
    console.error('Database status check error:', error);
    res.status(500).json({
      success: false,
      connected: false,
      message: 'Error checking database connection',
      error: error.message,
    });
  }
});

// Test MongoDB connection
app.post('/api/db/test-connection', async (req, res) => {
  try {
    const { uri } = req.body;
    if (!uri) {
      return res.status(400).json({
        success: false,
        message: 'MongoDB URI is required',
      });
    }

    const testConnection = mongoose.createConnection();

    const connectionTimeout = setTimeout(() => {
      if (testConnection.readyState !== 1) {
        testConnection.close();
        return res.status(500).json({
          success: false,
          connected: false,
          message: 'Connection timed out after 5 seconds',
        });
      }
    }, 5000);

    try {
      await testConnection.openUri(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      });

      clearTimeout(connectionTimeout);

      let dbInfo = {};
      try {
        const uriObj = new URL(uri);
        dbInfo = {
          host: uriObj.host,
          dbName: uriObj.pathname.substr(1) || 'default',
        };
      } catch (err) {
        dbInfo = { note: 'Could not parse connection details' };
      }

      await testConnection.close();

      return res.json({
        success: true,
        connected: true,
        message: 'Successfully connected to database',
        details: dbInfo,
      });
    } catch (err) {
      clearTimeout(connectionTimeout);
      try {
        if (testConnection) await testConnection.close();
      } catch (closeErr) {
        console.error('Error closing test connection:', closeErr);
      }
      return res.status(500).json({
        success: false,
        connected: false,
        message: 'Failed to connect to database',
        error: err.message,
      });
    }
  } catch (error) {
    console.error('Database connection test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing database connection',
      error: error.message,
    });
  }
});

// Test MongoDB CRUD operations
app.post('/api/db/test-operations', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: 'Database is not connected. Please check connection first.',
        operations: {
          create: false,
          read: false,
          update: false,
          delete: false,
        },
      });
    }

    const results = {
      success: true,
      operations: {
        create: false,
        read: false,
        update: false,
        delete: false,
      },
      details: [],
    };

    const testSchema = new mongoose.Schema({
      value: String,
      testId: String,
      createdAt: { type: Date, default: Date.now },
    }, { timestamps: true });

    const testId = 'test_' + Date.now();
    const TestModel = mongoose.connection.model(`DBTest_${testId}`, testSchema);

    try {
      // CREATE TEST
      const createStart = Date.now();
      const newDocument = new TestModel({
        value: 'test value',
        testId,
      });
      await newDocument.save();
      results.operations.create = true;
      results.details.push({
        operation: 'create',
        success: true,
        message: `Document created successfully in ${Date.now() - createStart}ms`,
        docId: newDocument._id,
      });

      // READ TEST
      const readStart = Date.now();
      const readDocument = await TestModel.findById(newDocument._id);
      if (readDocument && readDocument.value === 'test value') {
        results.operations.read = true;
        results.details.push({
          operation: 'read',
          success: true,
          message: `Document read successfully in ${Date.now() - readStart}ms`,
        });
      } else {
        throw new Error('Failed to read document correctly');
      }

      // UPDATE TEST
      const updateStart = Date.now();
      readDocument.value = 'updated value';
      await readDocument.save();
      const verifyUpdate = await TestModel.findById(newDocument._id);
      if (verifyUpdate && verifyUpdate.value === 'updated value') {
        results.operations.update = true;
        results.details.push({
          operation: 'update',
          success: true,
          message: `Document updated successfully in ${Date.now() - updateStart}ms`,
        });
      } else {
        throw new Error('Failed to update document correctly');
      }

      // DELETE TEST
      const deleteStart = Date.now();
      await TestModel.findByIdAndDelete(newDocument._id);
      const verifyDelete = await TestModel.findById(newDocument._id);
      if (!verifyDelete) {
        results.operations.delete = true;
        results.details.push({
          operation: 'delete',
          success: true,
          message: `Document deleted successfully in ${Date.now() - deleteStart}ms`,
        });
      } else {
        throw new Error('Failed to delete document correctly');
      }

      // Cleanup
      try {
        await mongoose.connection.dropCollection(`dbtest_${testId.toLowerCase()}`);
        results.details.push({
          operation: 'cleanup',
          success: true,
          message: 'Test collection dropped successfully',
        });
      } catch (err) {
        results.details.push({
          operation: 'cleanup',
          success: false,
          message: `Failed to drop test collection: ${err.message}`,
        });
      }
      results.message = 'All database operations completed successfully';
      return res.json(results);
    } catch (error) {
      results.success = false;
      results.message = `Database operations test failed: ${error.message}`;
      try {
        await mongoose.connection.dropCollection(`dbtest_${testId.toLowerCase()}`);
        results.details.push({
          operation: 'cleanup',
          success: true,
          message: 'Test collection dropped during error cleanup',
        });
      } catch (err) {
        // Ignore
      }
      return res.status(500).json(results);
    }
  } catch (error) {
    console.error('Database operations test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error executing database operations test',
      error: error.message,
    });
  }
});

// Montage des routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/technologies', technologieRoutes);
app.use('/api/collaborators', collaboratorRoutes);
app.use('/api/submission', submissionRoutes);
app.use('/api/performer', performerRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', preferenceRouter);
// Test endpoints
app.get('/api/test/public', (req, res) => {
  res.json({
    success: true,
    message: 'Public route - accessible to everyone',
  });
});

app.get('/api/test/protected', auth, (req, res) => {
  res.json({
    message: 'Protected endpoint - token valide nécessaire',
    user: {
      id: req.userId,
      role: req.userRole,
      name: req.user.name,
    },
  });
});

app.get('/api/test/auth', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Protected route - accessible to authenticated users',
    user: {
      id: req.userId,
      role: req.userRole,
      name: req.user.name,
    },
  });
});

app.get('/api/test/manager', auth, isManager, (req, res) => {
  res.json({
    success: true,
    message: 'Manager route - accessible to managers and admins only',
    user: {
      id: req.userId,
      role: req.userRole,
      name: req.user.name,
    },
  });
});

app.get('/api/test/admin', auth, isAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin route - accessible to admins only',
    user: {
      id: req.userId,
      role: req.userRole,
      name: req.user.name,
    },
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});