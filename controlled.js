const express = require('express');
const { faker } = require('@faker-js/faker');

// --- Configuration ---
const PORT = 3002;
const MOCK_COLLECTION_COUNT = 20;

// --- Module: Faker Resolver ---
const fakerResolver = {
  resolve(pathString) {
    if (typeof pathString !== 'string' || !pathString.startsWith('faker.')) {
      return pathString;
    }
    const pathParts = pathString.substring(6).split('.');
    let current = faker;
    for (const part of pathParts) {
      if (current[part] === undefined) {
        console.warn(`⚠️ Warning: Faker path not found: "${pathString}". Using original string.`);
        return pathString;
      }
      current = current[part];
    }
    if (typeof current === 'function') {
      return current();
    }
    return current;
  },
  generateAttributes(schema) {
    const generated = {};
    for (const key in schema) {
      const value = schema[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        generated[key] = this.generateAttributes(value);
      } else {
        generated[key] = this.resolve(value);
      }
    }
    return generated;
  }
};


// --- Main Application Logic ---
async function startServer() {
  const inquirer = await import('inquirer');
  const endpointDefinitions = [];
  console.log('--- Simple Manual API Builder ---');
  console.log('Define your endpoints and their exact JSON response structure.\n');

  while (true) {
    const { addAnother } = await inquirer.default.prompt([
      {
        type: 'confirm',
        name: 'addAnother',
        message: 'Do you want to add a new endpoint?',
        default: true,
      },
    ]);

    if (!addAnother) break;

    const answers = await inquirer.default.prompt([
      {
        type: 'input',
        name: 'path',
        message: 'Enter the endpoint path (e.g., /users or /users/:id):',
        validate: input => input.startsWith('/') ? true : 'Path must start with a "/"',
      },
      {
        type: 'editor',
        name: 'responseBody',
        message: 'Define the JSON response for a single item. (Opens in your editor)',
        default: `{
  "id": "faker.string.uuid",
  "name": "faker.person.fullName"
}`,
        validate: (input) => {
          try {
            JSON.parse(input);
            return true;
          } catch (e) {
            return `Invalid JSON: ${e.message}`;
          }
        }
      }
    ]);

    endpointDefinitions.push({
      path: answers.path,
      responseSchema: JSON.parse(answers.responseBody)
    });
    console.log(`✅ Endpoint "${answers.path}" added.\n`);
  }

  if (endpointDefinitions.length === 0) {
    console.log('No endpoints defined. Exiting.');
    return;
  }

  const app = express();
  const availableEndpoints = [];

  for (const definition of endpointDefinitions) {
    const { path, responseSchema } = definition;

    app.get(path, (req, res) => {
      // --- THE FIX IS HERE ---
      // New, more intelligent logic to determine response type.
      // We split the path by '/' and look at the very last segment.
      const pathSegments = path.split('/').filter(segment => segment.length > 0);
      const lastSegment = pathSegments.pop() || ''; // Get last part, or "" if path is just "/"

      // It's a single item if the last segment starts with a ':', e.g., ":id"
      const isSingleItem = lastSegment.startsWith(':');

      if (isSingleItem) {
        // It's a single item endpoint
        const singleItemResponse = fakerResolver.generateAttributes(responseSchema);
        res.json(singleItemResponse);
      } else {
        // It's a collection endpoint
        const collectionResponse = [];
        for (let i = 0; i < MOCK_COLLECTION_COUNT; i++) {
          collectionResponse.push(fakerResolver.generateAttributes(responseSchema));
        }
        res.json(collectionResponse);
      }
      // --- END OF FIX ---
    });

    availableEndpoints.push(`GET  ${path}`);
  }

  const server = app.listen(PORT, () => {
    console.log('----------------------------------------------------');
    console.log(`🚀 Simple Manual API Server is running on http://localhost:${PORT}`);
    console.log('✅ Generated the following endpoints:');
    availableEndpoints.forEach(endpoint => console.log(`   ${endpoint}`));
    console.log('----------------------------------------------------');
    console.log('Press CTRL+C to stop the server.');
  });

  const gracefulShutdown = () => {
    console.log('\nReceived signal to terminate, shutting down gracefully.');
    server.close(() => {
        console.log('Server has been closed.');
        process.exit(0);
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

startServer();