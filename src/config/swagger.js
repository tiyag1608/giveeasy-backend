const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GiveEasy Donation Platform API',
      version: '1.0.0',
      description:
        'RESTful API documentation for GiveEasy - A real-time donation platform powered by Node.js, Express, MongoDB, Socket.io, and Firebase.',
      contact: {
        name: 'GiveEasy Developer Support',
        email: 'developer@giveeasy.org',
      },
    },
    servers: [
      {
        url: 'http://localhost:5050',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format **Bearer <token>**',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['donor', 'admin', 'ngo_admin'] },
            panNumber: { type: 'string' },
          },
        },
        Cause: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            ngoName: { type: 'string' },
            ngoRegistrationNumber: { type: 'string' },
            contactEmail: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'verified', 'rejected'] },
          },
        },
        Campaign: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            targetAmount: { type: 'number' },
            raisedAmount: { type: 'number' },
            donorCount: { type: 'number' },
            percentageRaised: { type: 'number' },
            status: { type: 'string', enum: ['active', 'completed', 'paused'] },
          },
        },
        Donation: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            donorName: { type: 'string' },
            donorEmail: { type: 'string' },
            amount: { type: 'number' },
            transactionId: { type: 'string' },
            receiptNumber: { type: 'string' },
            isRecurring: { type: 'boolean' },
          },
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          summary: 'Register a new user',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Aarav Sharma' },
                    email: { type: 'string', example: 'aarav@example.com' },
                    password: { type: 'string', example: 'password123' },
                    role: { type: 'string', enum: ['donor', 'ngo_admin', 'admin'], example: 'donor' },
                    panNumber: { type: 'string', example: 'ABCDE1234F' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'User registered' } },
        },
      },
      '/api/auth/login': {
        post: {
          summary: 'User login',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'donor@giveeasy.org' },
                    password: { type: 'string', example: 'donor123' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Login successful' } },
        },
      },
      '/api/campaigns': {
        get: {
          summary: 'List all campaigns with filters & progress bars',
          tags: ['Campaigns'],
          parameters: [
            { in: 'query', name: 'category', schema: { type: 'string' } },
            { in: 'query', name: 'status', schema: { type: 'string' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'sort', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'List of campaigns' } },
        },
        post: {
          summary: 'Create a campaign (Admin/NGO only)',
          tags: ['Campaigns'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'causeId', 'targetAmount'],
                  properties: {
                    title: { type: 'string', example: 'Clean Water for Rural Schools' },
                    description: { type: 'string', example: 'Providing RO filters to 50 schools' },
                    causeId: { type: 'string', example: '6523abc...' },
                    targetAmount: { type: 'number', example: 500000 },
                    category: { type: 'string', example: 'Education' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Campaign created' } },
        },
      },
      '/api/campaigns/{id}': {
        get: {
          summary: 'Get campaign details by ID',
          tags: ['Campaigns'],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Campaign details' } },
        },
        put: {
          summary: 'Update campaign (Admin/NGO)',
          tags: ['Campaigns'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Campaign updated' } },
        },
      },
      '/api/causes': {
        get: {
          summary: 'Get verified causes (or all for Admin)',
          tags: ['Causes'],
          responses: { 200: { description: 'List of causes' } },
        },
        post: {
          summary: 'Submit a new cause for verification',
          tags: ['Causes'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'ngoName', 'ngoRegistrationNumber', 'contactEmail'],
                  properties: {
                    title: { type: 'string', example: 'Child Malnutrition Support' },
                    description: { type: 'string', example: 'Providing nutritious meals to children' },
                    category: { type: 'string', example: 'Healthcare' },
                    ngoName: { type: 'string', example: 'Asha Relief Foundation' },
                    ngoRegistrationNumber: { type: 'string', example: '12A/80G/2021/DEL' },
                    contactEmail: { type: 'string', example: 'asha@ngo.org' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Cause submitted' } },
        },
      },
      '/api/causes/{id}': {
        put: {
          summary: 'Admin verify cause (status: verified / rejected)',
          tags: ['Causes'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['verified', 'rejected', 'pending'] },
                    verificationNotes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Cause verified/updated' } },
        },
      },
      '/api/donations': {
        post: {
          summary: 'Make a donation (Triggers Socket.io update & Firebase push receipt)',
          tags: ['Donations'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['campaignId', 'amount', 'donorName', 'donorEmail'],
                  properties: {
                    campaignId: { type: 'string', example: '6523abc...' },
                    amount: { type: 'number', example: 2500 },
                    donorName: { type: 'string', example: 'Priya Verma' },
                    donorEmail: { type: 'string', example: 'priya@example.com' },
                    paymentMethod: { type: 'string', example: 'UPI' },
                    isRecurring: { type: 'boolean', example: false },
                    panNumber: { type: 'string', example: 'ABCDE1234F' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Donation created & real-time socket emitted' } },
        },
        get: {
          summary: 'List donations',
          tags: ['Donations'],
          responses: { 200: { description: 'List of donations' } },
        },
      },
      '/api/donations/{id}/receipt': {
        get: {
          summary: 'Get 80G Tax Exemption Certificate',
          tags: ['Donations'],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: '80G Tax Receipt data' } },
        },
      },
      '/api/donations/user/{id}': {
        get: {
          summary: 'Get donation history for user',
          tags: ['Donations'],
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'User donations' } },
        },
      },
      '/api/admin/campaigns': {
        get: {
          summary: 'Admin view of all campaigns with aggregated metrics',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Admin campaigns' } },
        },
      },
      '/api/admin/donations': {
        get: {
          summary: 'Admin view of all donations with financial summaries',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Admin donations' } },
        },
      },
      '/api/notifications/send': {
        post: {
          summary: 'Send Firebase push notification',
          tags: ['Notifications'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'body'],
                  properties: {
                    title: { type: 'string', example: 'New Milestone Reached!' },
                    body: { type: 'string', example: 'Your campaign reached 75% funding!' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Notification dispatched' } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
