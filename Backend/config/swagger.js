const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SkillsPlus API Documentation',
      version: '1.0.0',
      description: 'API documentation for the SkillsPlus application',
      contact: {
        name: 'SkillsPlus Support',
        email: 'support@skillsplus.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication operations',
      },
      {
        name: 'Test',
        description: 'Test endpoints for role-based access',
      },
      {
        name: 'System',
        description: 'System status and diagnostics endpoints',
      },
      {
        name: 'Courses',
        description: 'Courses management endpoints',
      }
      
    ],
  },
  apis: ['./routes/*.js', './server.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs; 