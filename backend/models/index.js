'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Load all model files
const modelFiles = fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  });

// Initialize models
console.log('Loading models from files:', modelFiles);
modelFiles.forEach(file => {
  const modelDef = require(path.join(__dirname, file));
  const model = modelDef(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
  console.log('Loaded model:', model.name);
});

// Set up associations between models
console.log('Setting up model associations...');
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
    console.log(`Set up associations for model: ${modelName}`);
  }
});

// Add sequelize instance and Sequelize class to db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Make models accessible under both db.ModelName and db.models.ModelName
db.models = db;

console.log('Models initialized:', Object.keys(db).filter(key => db[key].name));

module.exports = db;

