import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Physics with Mr Mohammed Sayed API',
      version: '1.0.0',
      description: 'API Documentation for Physics Learning Platform Backend',
    },
    tags: [
      { name: 'Auth', description: 'Registration, login, and current user' },
      { name: 'Student', description: 'Authenticated student operations' },
      { name: 'Admin / Teacher', description: 'Administrative and teaching operations' },
    ],
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
      schemas: {
        Error: {
          type: 'object',
          properties: { message: { type: 'string' }, errors: { type: 'object' } },
        },
        IdTokenRequest: {
          type: 'object', required: ['idToken'],
          properties: { idToken: { type: 'string' } },
        },
        ProfileUpdate: {
          type: 'object',
          properties: {
            name: { type: 'string' }, phone: { type: 'string' }, avatar: { type: 'string', format: 'uri' },
          },
        },
        Assignment: { type: 'object', properties: { id: { type: 'integer' }, title: { type: 'string' }, dueDate: { type: 'string', format: 'date-time' } } },
        Session: { type: 'object', properties: { id: { type: 'integer' }, studentId: { type: 'integer' }, teacherId: { type: 'integer' }, date: { type: 'string', format: 'date-time' }, status: { type: 'string' } } },
        Payment: { type: 'object', properties: { id: { type: 'integer' }, amount: { type: 'number' }, status: { type: 'string' } } },
        Resource: { type: 'object', properties: { id: { type: 'integer' }, title: { type: 'string' }, fileUrl: { type: 'string', format: 'uri' } } },
      },
      responses: {
        Unauthorized: { description: 'Authentication required' },
        ValidationError: { description: 'Request validation failed' },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.ts', './src/server.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);