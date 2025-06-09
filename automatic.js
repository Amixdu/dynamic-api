const express = require('express');
const { faker } = require('@faker-js/faker');
const pluralize = require('pluralize');

// --- Configuration ---
const PORT = 3001;
const MOCK_ITEM_COUNT = 20;

// --- Module 1: Parser ---
// This module interprets the user's relationship string.
const parser = {
  parse(inputString) {
    const entities = {};
    const relationshipPhrases = inputString.toLowerCase().split(/and(?:\s+each)?/);

    const relationshipRegex = /(?:a|an)\s+([a-z\s]+?)\s+(?:has|includes)\s+(?:multiple|many)\s+([a-z\s]+)/;

    relationshipPhrases.forEach(phrase => {
      const match = phrase.trim().match(relationshipRegex);
      if (match) {
        const parentSingular = match[1].trim().replace(/\s/g, '-'); // e.g., "study domain" -> "study-domain"
        const childSingular = match[2].trim().replace(/\s/g, '-');

        // Add parent entity if it doesn't exist
        if (!entities[parentSingular]) {
          entities[parentSingular] = { relationships: {} };
        }
        // Add child entity if it doesn't exist
        if (!entities[childSingular]) {
          entities[childSingular] = { relationships: {} };
        }

        // Establish the relationship
        const childPlural = pluralize(childSingular);
        entities[parentSingular].relationships[childPlural] = {
          type: 'hasMany',
          entity: childSingular,
        };
      }
    });
    return entities;
  },
};

// --- Module 2: Data Generator ---
// This module creates mock data based on the parsed entities.
const dataGenerator = {
  generate(entities) {
    const db = {};
    const entityNames = Object.keys(entities);

    // First pass: create all items
    entityNames.forEach(entityName => {
      const entityPlural = pluralize(entityName);
      db[entityPlural] = [];
      for (let i = 0; i < MOCK_ITEM_COUNT; i++) {
        db[entityPlural].push({
          id: faker.string.uuid(),
          name: faker.company.name(),
          createdAt: faker.date.past(),
        });
      }
    });

    // Second pass: link items based on relationships
    entityNames.forEach(parentName => {
      const parentPlural = pluralize(parentName);
      const parentRelationships = entities[parentName].relationships;

      Object.keys(parentRelationships).forEach(childPlural => {
        const parentIdField = `${parentName}Id`; // e.g., universityId

        // Assign each child a random parent
        if (db[childPlural]) {
            db[childPlural].forEach(child => {
                const randomParent = db[parentPlural][Math.floor(Math.random() * db[parentPlural].length)];
                child[parentIdField] = randomParent.id;
            });
        }
      });
    });

    return db;
  },
};

// --- Module 3: JSON:API Formatter ---
// This module formats plain data into a JSON:API compliant structure.
const jsonApiFormatter = {
  formatResource(item, type, allEntities) {
    if (!item) return null;
    const { id, ...attributes } = item;

    const relationshipData = {};
    const parentEntity = allEntities[pluralize.singular(type)];
    if (parentEntity && parentEntity.relationships) {
      for (const relName in parentEntity.relationships) {
        relationshipData[relName] = {
          links: {
            related: `/${type}/${id}/${relName}`,
          },
        };
      }
    }

    return {
      id: id.toString(),
      type: type,
      attributes,
      links: {
        self: `/${type}/${id}`,
      },
      relationships: relationshipData,
    };
  },

  formatCollection(items, type, allEntities) {
    return items.map(item => this.formatResource(item, type, allEntities));
  },

  formatError(status, title, detail) {
      return {
          errors: [{
              status: status.toString(),
              title,
              detail
          }]
      }
  }
};

// --- Main Application Logic ---
async function startServer() {
  const inquirer = await import('inquirer');
  const { relationshipString } = await inquirer.default.prompt([
    {
      type: 'input',
      name: 'relationshipString',
      message: 'Describe your entity relationships:',
      default: 'a university has many programs and each program has many domains',
    },
  ]);

  const entities = parser.parse(relationshipString);
  const db = dataGenerator.generate(entities);
  const app = express();
  const availableEndpoints = [];

  // Dynamically create routes for each entity
  Object.keys(entities).forEach(entityName => {
    const plural = pluralize(entityName);

    // GET /<plural> (e.g., /universities)
    app.get(`/${plural}`, (req, res) => {
      const collection = db[plural] || [];
      const formattedData = jsonApiFormatter.formatCollection(collection, plural, entities);
      res.json({ data: formattedData });
    });
    availableEndpoints.push(`GET  /${plural}`);

    // GET /<plural>/:id (e.g., /universities/:id)
    app.get(`/${plural}/:id`, (req, res) => {
      const collection = db[plural] || [];
      const item = collection.find(i => i.id === req.params.id);
      if (!item) {
        return res.status(404).json(jsonApiFormatter.formatError(404, 'Resource Not Found', `No resource of type '${plural}' with ID '${req.params.id}' was found.`));
      }
      const formattedData = jsonApiFormatter.formatResource(item, plural, entities);
      res.json({ data: formattedData });
    });
    availableEndpoints.push(`GET  /${plural}/:id`);

    // Create routes for relationships
    const relationships = entities[entityName].relationships;
    Object.keys(relationships).forEach(childPlural => {
      const childName = relationships[childPlural].entity;
      const parentIdField = `${entityName}Id`; // e.g., universityId

      // GET /<parent_plural>/:id/<child_plural> (e.g., /universities/:id/programs)
      app.get(`/${plural}/:id/${childPlural}`, (req, res) => {
        const parentId = req.params.id;
        // Check if parent exists
        const parentExists = (db[plural] || []).some(p => p.id === parentId);
        if(!parentExists) {
            return res.status(404).json(jsonApiFormatter.formatError(404, 'Parent Resource Not Found', `No resource of type '${plural}' with ID '${parentId}' was found.`));
        }

        const relatedItems = (db[childPlural] || []).filter(child => child[parentIdField] === parentId);
        const formattedData = jsonApiFormatter.formatCollection(relatedItems, childPlural, entities);
        res.json({ data: formattedData });
      });
      availableEndpoints.push(`GET  /${plural}/:id/${childPlural}`);
    });
  });

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Dynamic API Server is running on http://localhost:${PORT}`);
    console.log('----------------------------------------------------');
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