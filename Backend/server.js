import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpecs from "./config/swagger.js";
import mongoose from "mongoose";
import "./cronTask.js";
import http from "http";
import { Server } from "socket.io";

// Préparer le changement dans Mongoose 7
mongoose.set("strictQuery", false); // ou true, selon ce que tu préfères

// Charge les variables d'environnement

// Connexion à la base de données via la config (ex: ./config/connect)
import test from "./config/connect.js";

test();
const app = express();

// Middleware globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//-------------------------------------------------------------------------------//
const server = http.createServer(app);

// Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend React Vite
    methods: ["GET", "POST"],
  },
});
export { io };
export const connectedUsers = new Map();

io.on("connection", (socket) => {
  //console.log("✅ Utilisateur connecté :", socket.id);

  // Associer un userId au socket si tu veux notifier un utilisateur précis
  socket.on("register", (userId) => {
    if (!userId) {
      console.warn("⚠️ userId invalide reçu dans register");
      return;
    }

    console.log(`🔐 userId reçu dans register: ${userId}`);
    connectedUsers.set(userId, socket.id);
  });

  socket.on("disconnect", () => {
    //console.log("❌ Utilisateur déconnecté :", socket.id);
    for (let [userId, id] of connectedUsers.entries()) {
      if (id === socket.id) connectedUsers.delete(userId);
    }
  });
});

// Exemple d’envoi de notification à tous
app.post("/api/notify-all", (req, res) => {
  const data = {
    type: "info",
    message: "🎓 Une nouvelle formation est disponible !",
  };
  io.emit("receiveNotification", data);
  res.send("Notification envoyée à tous");
});

// Exemple d’envoi à un user spécifique
app.post("/api/notify-user/:userId", (req, res) => {
  const userId = req.params.userId;
  const socketId = connectedUsers.get(userId);

  console.log(`📨 Requête Postman pour userId: ${userId}`);
  console.log(`📡 Socket trouvé: ${socketId}`);

  if (socketId) {
    io.to(socketId).emit("receiveNotification", {
      type: "test",
      message: "✅ Vous avez terminé un test avec succès !",
    });
    res.send("Notification envoyée");
  } else {
    res.status(404).send("Utilisateur non connecté");
  }
});

//-------------------------------------------------------------------------------//

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, { explorer: true })
);

// Import des middlewares d'authentification
import { auth, isAdmin, isManager } from "./middleware/auth.js";

// Importation des routes depuis des fichiers séparés
import authRoutes from "./controllers/auth.controller.js";
import userRoutes from "./controllers/user.controller.js";
import collaboratorRoutes from "./controllers/collaborator.controller.js";
import testRoutes from "./controllers/test.controller.js";
import taskRoutes from "./controllers/task.controller.js";
import technologieRoutes from "./controllers/technology.controller.js";
import formationRoutes from "./controllers/formation.controller.js";
// import recommendationRoutes from './controllers/recommandation.controller.js';
import submissionRoutes from "./controllers/submission.controller.js";
import performerRoutes from "./controllers/performer.controller.js";
import codeEvaluationRoutes from "./controllers/evaluate.controller.js";
import uploadRoutes from "./controllers/upload.controller.js";
import notificationRouter from "./controllers/notification.controller.js";

// Route racine affichant quelques informations sur l'API
app.get("/", (req, res) => {
  res.json({
    name: "SkillsPlus API",
    version: "1.0.0",
    description: "Backend API for SkillsPlus application",
    documentation: `${req.protocol}://${req.get("host")}/api-docs`,
    endpoints: {
      auth: "/api/auth",
      user: "/api/users",
      test: "/api/test",
    },
    environments: {
      development: "http://localhost:5000",
      production: process.env.PRODUCTION_URL || "Not configured",
    },
    authKeys: {
      CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY
        ? "Configured"
        : "Not configured",
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY
        ? "Configured"
        : "Not configured",
      JWT_SECRET: process.env.JWT_SECRET ? "Configured" : "Not configured",
    },
  });
});

// Endpoints pour la base de données

// 1. Vérifier le statut de la connexion à MongoDB
app.get("/api/db/status", (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    const connected = state === 1;
    const dbName = mongoose.connection.name || "No database name available";
    const dbHost = mongoose.connection.host || "No host information available";
    const dbPort = mongoose.connection.port || "No port information available";
    let collections = [];
    if (connected) {
      try {
        collections = Object.keys(mongoose.connection.collections);
      } catch (err) {
        console.error("Error getting collections:", err);
      }
    }

    res.json({
      success: true,
      connected,
      message: connected
        ? "Database connection is valid"
        : `Database is ${states[state]}`,
      status: state,
      statusText: states[state],
      database: process.env.MONGODB_URI
        ? `${process.env.MONGODB_URI.split("@")[1]}`
        : "No connection string available",
      details: {
        name: dbName,
        host: dbHost,
        port: dbPort,
        collections:
          collections.length > 0
            ? collections
            : "No collections info available",
      },
    });
  } catch (error) {
    console.error("Database status check error:", error);
    res.status(500).json({
      success: false,
      connected: false,
      message: "Error checking database connection",
      error: error.message,
    });
  }
});

// 2. Tester une connexion MongoDB personnalisée
app.post("/api/db/test-connection", async (req, res) => {
  try {
    const { uri } = req.body;
    if (!uri) {
      return res.status(400).json({
        success: false,
        message: "MongoDB URI is required",
      });
    }

    const testConnection = mongoose.createConnection();

    const connectionTimeout = setTimeout(() => {
      if (testConnection.readyState !== 1) {
        testConnection.close();
        return res.status(500).json({
          success: false,
          connected: false,
          message: "Connection timed out after 5 seconds",
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
          dbName: uriObj.pathname.substr(1) || "default",
        };
      } catch (err) {
        dbInfo = { note: "Could not parse connection details" };
      }

      await testConnection.close();

      return res.json({
        success: true,
        connected: true,
        message: "Successfully connected to database",
        details: dbInfo,
      });
    } catch (err) {
      clearTimeout(connectionTimeout);
      try {
        if (testConnection) await testConnection.close();
      } catch (closeErr) {
        console.error("Error closing test connection:", closeErr);
      }
      return res.status(500).json({
        success: false,
        connected: false,
        message: "Failed to connect to database",
        error: err.message,
      });
    }
  } catch (error) {
    console.error("Database connection test error:", error);
    return res.status(500).json({
      success: false,
      message: "Error testing database connection",
      error: error.message,
    });
  }
});

// 3. Tester les opérations CRUD sur MongoDB
app.post("/api/db/test-operations", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: "Database is not connected. Please check connection first.",
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

    const testSchema = new mongoose.Schema(
      {
        value: String,
        testId: String,
        createdAt: { type: Date, default: Date.now },
      },
      { timestamps: true }
    );

    const testId = "test_" + Date.now();
    const TestModel = mongoose.connection.model(`DBTest_${testId}`, testSchema);

    try {
      // 1. CREATE TEST
      const createStart = Date.now();
      const newDocument = new TestModel({
        value: "test value",
        testId,
      });
      await newDocument.save();
      results.operations.create = true;
      results.details.push({
        operation: "create",
        success: true,
        message: `Document created successfully in ${
          Date.now() - createStart
        }ms`,
        docId: newDocument._id,
      });

      // 2. READ TEST
      const readStart = Date.now();
      const readDocument = await TestModel.findById(newDocument._id);
      if (readDocument && readDocument.value === "test value") {
        results.operations.read = true;
        results.details.push({
          operation: "read",
          success: true,
          message: `Document read successfully in ${Date.now() - readStart}ms`,
        });
      } else {
        throw new Error("Failed to read document correctly");
      }

      // 3. UPDATE TEST
      const updateStart = Date.now();
      readDocument.value = "updated value";
      await readDocument.save();
      const verifyUpdate = await TestModel.findById(newDocument._id);
      if (verifyUpdate && verifyUpdate.value === "updated value") {
        results.operations.update = true;
        results.details.push({
          operation: "update",
          success: true,
          message: `Document updated successfully in ${
            Date.now() - updateStart
          }ms`,
        });
      } else {
        throw new Error("Failed to update document correctly");
      }

      // 4. DELETE TEST
      const deleteStart = Date.now();
      await TestModel.findByIdAndDelete(newDocument._id);
      const verifyDelete = await TestModel.findById(newDocument._id);
      if (!verifyDelete) {
        results.operations.delete = true;
        results.details.push({
          operation: "delete",
          success: true,
          message: `Document deleted successfully in ${
            Date.now() - deleteStart
          }ms`,
        });
      } else {
        throw new Error("Failed to delete document correctly");
      }

      // Nettoyage : suppression de la collection temporaire
      try {
        await mongoose.connection.dropCollection(
          `dbtest_${testId.toLowerCase()}`
        );
        results.details.push({
          operation: "cleanup",
          success: true,
          message: "Test collection dropped successfully",
        });
      } catch (err) {
        results.details.push({
          operation: "cleanup",
          success: false,
          message: `Failed to drop test collection: ${err.message}`,
        });
      }
      results.message = "All database operations completed successfully";
      return res.json(results);
    } catch (error) {
      results.success = false;
      results.message = `Database operations test failed: ${error.message}`;
      try {
        await mongoose.connection.dropCollection(
          `dbtest_${testId.toLowerCase()}`
        );
        results.details.push({
          operation: "cleanup",
          success: true,
          message: "Test collection dropped during error cleanup",
        });
      } catch (err) {
        // En cas d'échec, on ne fait rien
      }
      return res.status(500).json(results);
    }
  } catch (error) {
    console.error("Database operations test error:", error);
    return res.status(500).json({
      success: false,
      message: "Error executing database operations test",
      error: error.message,
    });
  }
});

// Montage des routes issues des fichiers séparés
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/technologies", technologieRoutes);
app.use("/api/formations", formationRoutes);
//app.use('/api/recommendations', recommendationRoutes);
app.use("/api/collaborators", collaboratorRoutes);
app.use("/api/submission", submissionRoutes);
app.use("/api/performer", performerRoutes);
app.use("/api/code", codeEvaluationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/images", express.static("public/images"));
app.use("/api/notifications", notificationRouter);

// Endpoints de test pour l'API

// Endpoint public accessible à tout le monde
app.get("/api/test/public", (req, res) => {
  res.json({
    success: true,
    message: "Public route - accessible to everyone",
  });
});

// Endpoint protégé nécessitant une authentification avec JWT
app.get("/api/test/protected", auth, (req, res) => {
  res.json({
    message: "Protected endpoint - token valide nécessaire",
    user: {
      id: req.userId,
      role: req.userRole,
      name: req.user.name,
    },
  });
});

// Endpoint nécessitant une authentification (version existante)
app.get("/api/test/auth", auth, (req, res) => {
  res.json({
    success: true,
    message: "Protected route - accessible to authenticated users",
    user: {
      id: req.userId,
      role: req.userRole,
      name: req.user.name,
    },
  });
});

// Endpoint réservé aux managers ou aux administrateurs
app.get("/api/test/manager", auth, isManager, (req, res) => {
  res.json({
    success: true,
    message: "Manager route - accessible to managers and admins only",
    user: {
      id: req.userId,
      role: req.userRole,
      name: req.user.name,
    },
  });
});

// Endpoint réservé uniquement aux administrateurs
app.get("/api/test/admin", auth, isAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Admin route - accessible to admins only",
    user: {
      id: req.userId,
      role: req.userRole,
      name: req.user.name,
    },
  });
});

// Définition du port et démarrage du serveur
const PORT = process.env.PORT || 5000;

/*app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});*/

server.listen(PORT, () => {
  console.log(`✅ Server with Socket.IO running on port ${PORT}`);
  console.log(
    `API Documentation available at http://localhost:${PORT}/api-docs`
  );
});
