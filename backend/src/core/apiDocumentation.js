// Automatic API Documentation Generator
const logger = require('../utils/logger');

class APIDocumentation {
  constructor() {
    this.endpoints = [];
    this.schemas = {};
  }

  registerEndpoint(config) {
    this.endpoints.push({
      method: config.method || 'GET',
      path: config.path,
      description: config.description,
      authentication: config.authentication || false,
      parameters: config.parameters || [],
      requestBody: config.requestBody || null,
      responses: config.responses || {},
      examples: config.examples || {},
      tags: config.tags || [],
      deprecated: config.deprecated || false
    });
  }

  registerSchema(name, schema) {
    this.schemas[name] = schema;
  }

  generateOpenAPI() {
    return {
      openapi: '3.0.0',
      info: {
        title: 'EBDESIGN Agricultural Platform API',
        version: '1.0.0',
        description: 'Production-grade agricultural digital operating system',
        contact: { name: 'EBDESIGN Team', url: 'https://ebdesign.io' }
      },
      servers: [
        { url: 'http://localhost:3000/api/v1', description: 'Development' },
        { url: 'https://api.ebdesign.io/api/v1', description: 'Production' }
      ],
      paths: this.generatePaths(),
      components: {
        schemas: this.schemas,
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };
  }

  generatePaths() {
    const paths = {};

    for (const endpoint of this.endpoints) {
      const pathKey = endpoint.path;

      if (!paths[pathKey]) {
        paths[pathKey] = {};
      }

      paths[pathKey][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        tags: endpoint.tags,
        deprecated: endpoint.deprecated,
        ...(endpoint.authentication && {
          security: [{ bearerAuth: [] }]
        }),
        ...(endpoint.parameters.length > 0 && {
          parameters: endpoint.parameters
        }),
        ...(endpoint.requestBody && {
          requestBody: endpoint.requestBody
        }),
        responses: endpoint.responses
      };
    }

    return paths;
  }

  generateMarkdown() {
    let markdown = `# EBDESIGN API Documentation\n\n`;
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    markdown += `## Authentication\n\n`;
    markdown += `All endpoints require a Bearer token in the Authorization header.\n\n`;
    markdown += `\`\`\`\nAuthorization: Bearer YOUR_JWT_TOKEN\n\`\`\`\n\n`;

    // Group by tags
    const byTag = {};
    for (const endpoint of this.endpoints) {
      const tags = endpoint.tags.length > 0 ? endpoint.tags : ['General'];
      for (const tag of tags) {
        if (!byTag[tag]) byTag[tag] = [];
        byTag[tag].push(endpoint);
      }
    }

    for (const [tag, endpoints] of Object.entries(byTag)) {
      markdown += `## ${tag}\n\n`;

      for (const endpoint of endpoints) {
        markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
        markdown += `${endpoint.description}\n\n`;

        if (endpoint.parameters.length > 0) {
          markdown += `**Parameters:**\n\n`;
          for (const param of endpoint.parameters) {
            markdown += `- \`${param.name}\` (${param.in}): ${param.description}\n`;
          }
          markdown += `\n`;
        }

        if (endpoint.examples[endpoint.method]) {
          markdown += `**Example:**\n\n`;
          markdown += `\`\`\`bash\n`;
          markdown += endpoint.examples[endpoint.method];
          markdown += `\n\`\`\`\n\n`;
        }
      }
    }

    return markdown;
  }
}

module.exports = new APIDocumentation();
