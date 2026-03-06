require("dotenv").config();
const {
  POSTGRE_HOST,
  POSTGRE_DB,
  POSTGRE_PORT,
  POSTGRE_USERNAME,
  POSTGRE_PASSWORD,
} = process.env;

const pool = {
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  min: parseInt(process.env.DB_POOL_MIN) || 5,
  acquire: 30000,
  idle: 10000,
};

const config = {
  development: {
    username: POSTGRE_USERNAME,
    password: POSTGRE_PASSWORD,
    database: POSTGRE_DB,
    host: POSTGRE_HOST,
    port: POSTGRE_PORT,
    dialect: "postgres",
    logging: false,
    pool,
  },
  test: {
    username: POSTGRE_USERNAME,
    password: POSTGRE_PASSWORD,
    database: POSTGRE_DB,
    host: POSTGRE_HOST,
    port: POSTGRE_PORT,
    dialect: "postgres",
    logging: false,
    pool,
  },
  production: {
    username: POSTGRE_USERNAME,
    password: POSTGRE_PASSWORD,
    database: POSTGRE_DB,
    host: POSTGRE_HOST,
    port: POSTGRE_PORT,
    dialect: "postgres",
    logging: false,
    pool,
    dialectOptions: {
      ssl: process.env.DB_SSL === "true"
        ? { require: true, rejectUnauthorized: false }
        : false,
    },
  },
};

module.exports = config;
