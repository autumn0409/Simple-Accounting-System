require("dotenv").config();

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");

const basename = path.basename(__filename); // index.js
const env = process.env.NODE_ENV || "development";
const config = require("../config/config.js")[env];

const db = {};

let sequelize = null;

if (process.env.CLEARDB_DATABASE_URL) {
  sequelize = new Sequelize(process.env.CLEARDB_DATABASE_URL, {
    dialect: config.dialect,
    protocol: config.protocol,
    pool: {
      max: 10,
      min: 0,
      idle: 30000,
    },
  });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    pool: {
      max: 10,
      min: 0,
      idle: 30000,
    },
  });
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
