require("dotenv").config();
const {
  POSTGRE_HOST,
  POSTGRE_DB,
  POSTGRE_PORT,
  POSTGRE_USERNAME,
  POSTGRE_PASSWORD,
} = process.env;

const config = {
  development: {
    username: POSTGRE_USERNAME,
    password: POSTGRE_PASSWORD,
    database: POSTGRE_DB,
    host: POSTGRE_HOST,
    port: POSTGRE_PORT,
    dialect: "postgres",
  },
  test: {
    username: POSTGRE_USERNAME,
    password: POSTGRE_PASSWORD,
    database: POSTGRE_DB,
    host: POSTGRE_HOST,
    port: POSTGRE_PORT,
    dialect: "postgres",
  },
  production: {
    username: POSTGRE_USERNAME,
    password: POSTGRE_PASSWORD,
    database: POSTGRE_DB,
    host: POSTGRE_HOST,
    port: POSTGRE_PORT,
    dialect: "postgres",
  },
};

module.exports = config;
