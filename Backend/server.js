const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Connect to database
require('./config/connect');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, { explorer: true }));

// Import middleware
const { auth, isAdmin, isManager } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');

// Root route with API info
app.get('/', (req, res) => {
  res.json({
    name: 'SkillsPlus API',
    version: '1.0.0',
    description: 'Backend API for SkillsPlus application',
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    endpoints: {
      auth: '/api/auth',
      test: '/api/test'
    },
    environments: {
      development: 'http://localhost:5000',
      production: process.env.PRODUCTION_URL || 'Not configured'
    },
    authKeys: {
      'CLERK_PUBLISHABLE_KEY': process.env.CLERK_PUBLISHABLE_KEY ? 'Configured' : 'Not configured',
      'CLERK_SECRET_KEY': process.env.CLERK_SECRET_KEY ? 'Configured' : 'Not configured',
      'JWT_SECRET': process.env.JWT_SECRET ? 'Configured' : 'Not configured'
    }
  });
});

/**
 * @swagger
 * /api/db/status:
 *   get:
 *     summary: Check database connection status
 *     tags: [System]
 *     description: Verifies if the MongoDB database connection is valid and working
 *     responses:
 *       200:
 *         description: Database connection status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 connected:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Database connection is valid
 *                 status:
 *                   type: number
 *                   description: Mongoose connection state (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)
 *                   example: 1
 *                 database:
 *                   type: string
 *                   example: mongodb://localhost:27017/skillsplus
 *       500:
 *         description: Server error
 */
app.get('/api/db/status', (req, res) => {
  try {
    // Check Mongoose connection state
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Get connection details
    const connected = state === 1;
    const dbName = mongoose.connection.name || 'No database name available';
    const dbHost = mongoose.connection.host || 'No host information available';
    const dbPort = mongoose.connection.port || 'No port information available';

    // Get some basic stats if connected
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
        collections: collections.length > 0 ? collections : 'No collections info available'
      }
    });
  } catch (error) {
    console.error('Database status check error:', error);
    res.status(500).json({
      success: false,
      connected: false,
      message: 'Error checking database connection',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/db/test-connection:
 *   post:
 *     summary: Test a custom MongoDB connection URI
 *     tags: [System]
 *     description: Tests if a provided MongoDB URI can establish a valid connection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uri
 *             properties:
 *               uri:
 *                 type: string
 *                 description: MongoDB connection URI to test
 *                 example: mongodb+srv://username:password@cluster.mongodb.net/dbname
 *     responses:
 *       200:
 *         description: Connection test results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 connected:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Successfully connected to database
 *                 details:
 *                   type: object
 *                   properties:
 *                     host:
 *                       type: string
 *                       example: cluster.mongodb.net
 *                     dbName:
 *                       type: string
 *                       example: dbname
 *       400:
 *         description: Invalid MongoDB URI
 *       500:
 *         description: Server error or connection failed
 */
app.post('/api/db/test-connection', async (req, res) => {
  try {
    const { uri } = req.body;
    
    if (!uri) {
      return res.status(400).json({
        success: false,
        message: 'MongoDB URI is required'
      });
    }

    // Create a new Mongoose connection for testing
    const testConnection = mongoose.createConnection();
    
    // Set a timeout for the connection attempt
    const connectionTimeout = setTimeout(() => {
      if (testConnection.readyState !== 1) {
        testConnection.close();
        return res.status(500).json({
          success: false,
          connected: false,
          message: 'Connection timed out after 5 seconds'
        });
      }
    }, 5000);

    try {
      // Attempt to connect with the provided URI
      await testConnection.openUri(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });

      // If we reach here, connection was successful
      clearTimeout(connectionTimeout);

      // Extract sanitized database information (without credentials)
      let dbInfo = {};
      try {
        const uriObj = new URL(uri);
        dbInfo = {
          host: uriObj.host,
          dbName: uriObj.pathname.substr(1) || 'default'
        };
      } catch (err) {
        dbInfo = { note: 'Could not parse connection details' };
      }

      // Close the test connection
      await testConnection.close();

      return res.json({
        success: true,
        connected: true,
        message: 'Successfully connected to database',
        details: dbInfo
      });
    } catch (err) {
      clearTimeout(connectionTimeout);
      
      // Try to close the connection if it exists
      try {
        if (testConnection) await testConnection.close();
      } catch (closeErr) {
        console.error('Error closing test connection:', closeErr);
      }

      return res.status(500).json({
        success: false,
        connected: false,
        message: 'Failed to connect to database',
        error: err.message
      });
    }
  } catch (error) {
    console.error('Database connection test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing database connection',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/db/test-operations:
 *   post:
 *     summary: Test CRUD operations on MongoDB
 *     tags: [System]
 *     description: Performs a series of create, read, update, delete operations to verify database functionality
 *     responses:
 *       200:
 *         description: Database operations test results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: All database operations completed successfully
 *                 operations:
 *                   type: object
 *                   properties:
 *                     create:
 *                       type: boolean
 *                       example: true
 *                     read:
 *                       type: boolean
 *                       example: true
 *                     update:
 *                       type: boolean
 *                       example: true
 *                     delete:
 *                       type: boolean
 *                       example: true
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       operation:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       message:
 *                         type: string
 *       500:
 *         description: Server error or database operation failed
 */
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
          delete: false
        }
      });
    }

    // Results to track operations
    const results = {
      success: true,
      operations: {
        create: false,
        read: false,
        update: false,
        delete: false
      },
      details: []
    };

    // Create a temporary test collection and schema
    const testSchema = new mongoose.Schema({
      value: String,
      testId: String,
      createdAt: { type: Date, default: Date.now }
    }, { timestamps: true });

    // Generate a unique ID for this test run to avoid conflicts with other tests
    const testId = 'test_' + Date.now();
    
    // Create the model with a unique collection name to avoid conflicts
    const TestModel = mongoose.connection.model(`DBTest_${testId}`, testSchema);

    try {
      // 1. CREATE TEST
      const createStart = Date.now();
      const newDocument = new TestModel({
        value: 'test value',
        testId
      });
      await newDocument.save();
      results.operations.create = true;
      results.details.push({
        operation: 'create',
        success: true,
        message: `Document created successfully in ${Date.now() - createStart}ms`,
        docId: newDocument._id
      });

      // 2. READ TEST
      const readStart = Date.now();
      const readDocument = await TestModel.findById(newDocument._id);
      if (readDocument && readDocument.value === 'test value') {
        results.operations.read = true;
        results.details.push({
          operation: 'read',
          success: true,
          message: `Document read successfully in ${Date.now() - readStart}ms`
        });
      } else {
        throw new Error('Failed to read document correctly');
      }

      // 3. UPDATE TEST
      const updateStart = Date.now();
      readDocument.value = 'updated value';
      await readDocument.save();
      const verifyUpdate = await TestModel.findById(newDocument._id);
      if (verifyUpdate && verifyUpdate.value === 'updated value') {
        results.operations.update = true;
        results.details.push({
          operation: 'update',
          success: true,
          message: `Document updated successfully in ${Date.now() - updateStart}ms`
        });
      } else {
        throw new Error('Failed to update document correctly');
      }

      // 4. DELETE TEST
      const deleteStart = Date.now();
      await TestModel.findByIdAndDelete(newDocument._id);
      const verifyDelete = await TestModel.findById(newDocument._id);
      if (!verifyDelete) {
        results.operations.delete = true;
        results.details.push({
          operation: 'delete',
          success: true,
          message: `Document deleted successfully in ${Date.now() - deleteStart}ms`
        });
      } else {
        throw new Error('Failed to delete document correctly');
      }

      // 5. Finally, clean up by dropping the test collection
      try {
        await mongoose.connection.dropCollection(`dbtest_${testId.toLowerCase()}`);
        results.details.push({
          operation: 'cleanup',
          success: true,
          message: 'Test collection dropped successfully'
        });
      } catch (err) {
        results.details.push({
          operation: 'cleanup',
          success: false,
          message: `Failed to drop test collection: ${err.message}`
        });
      }

      // All operations successful
      results.message = 'All database operations completed successfully';
      return res.json(results);

    } catch (error) {
      // If any operation fails, return the results so far
      results.success = false;
      results.message = `Database operations test failed: ${error.message}`;
      
      // Try to clean up anyway
      try {
        await mongoose.connection.dropCollection(`dbtest_${testId.toLowerCase()}`);
        results.details.push({
          operation: 'cleanup',
          success: true,
          message: 'Test collection dropped during error cleanup'
        });
      } catch (err) {
        // Drop will fail if the collection wasn't created, which is fine
      }
      
      return res.status(500).json(results);
    }
  } catch (error) {
    console.error('Database operations test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error executing database operations test',
      error: error.message
    });
  }
});

// Mount routes
app.use('/api/auth', authRoutes);

/**
 * @swagger
 * /api/test/public:
 *   get:
 *     summary: Public test endpoint
 *     tags: [Test]
 *     description: This endpoint is accessible to everyone without authentication
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Public route - accessible to everyone
 */
app.get('/api/test/public', (req, res) => {
    res.json({
        success: true,
        message: 'Public route - accessible to everyone'
    });
});

/**
 * @swagger
 * /api/test/auth:
 *   get:
 *     summary: Authenticated test endpoint
 *     tags: [Test]
 *     description: This endpoint requires authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Protected route - accessible to authenticated users
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     role:
 *                       type: number
 *                     name:
 *                       type: string
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
app.get('/api/test/auth', auth, (req, res) => {
    res.json({
        success: true,
        message: 'Protected route - accessible to authenticated users',
        user: {
            id: req.userId,
            role: req.userRole,
            name: req.user.name
        }
    });
});

/**
 * @swagger
 * /api/test/manager:
 *   get:
 *     summary: Manager test endpoint
 *     tags: [Test]
 *     description: This endpoint requires manager or admin role (role 1 or 2)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Manager route - accessible to managers and admins only
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     role:
 *                       type: number
 *                     name:
 *                       type: string
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - insufficient privileges
 */
app.get('/api/test/manager', auth, isManager, (req, res) => {
    res.json({
        success: true,
        message: 'Manager route - accessible to managers and admins only',
        user: {
            id: req.userId,
            role: req.userRole,
            name: req.user.name
        }
    });
});

/**
 * @swagger
 * /api/test/admin:
 *   get:
 *     summary: Admin test endpoint
 *     tags: [Test]
 *     description: This endpoint requires admin role (role 1)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin route - accessible to admins only
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     role:
 *                       type: number
 *                     name:
 *                       type: string
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - insufficient privileges
 */
app.get('/api/test/admin', auth, isAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'Admin route - accessible to admins only',
        user: {
            id: req.userId,
            role: req.userRole,
            name: req.user.name
        }
    });
});

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});




