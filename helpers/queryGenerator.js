const { Op } = require("sequelize");
const moment = require("moment-timezone");

function generateFilter(filters) {
  const filter = {};
  filters.forEach(({ column, operator, value, model }) => {
    /**
     * Definition
     * 1. Column for ur database column name
     * 2. operator for query type (=, !=, contains)
     * 3. value for query value
     * 4. model define in ur models (Warehouse_Product, Master_Product)
     */
    if (
      column &&
      operator &&
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      const target = model ? (filter[model] = filter[model] || {}) : filter;
      switch (operator) {
        case "=":
          target[column] = value;
          break;
        case "!=":
          target[column] = { [Op.ne]: value };
          break;
        case "contains":
          target[column] = { [Op.like]: `%${value}%` };
          break;
        // Handle "active" status where deletedAt is null
        case "active":
          target[column] = { [Op.eq]: null };
          break;
        // Handle "not active" status where deletedAt is not null
        case "notActive":
          target[column] = { [Op.not]: null };
          break;
        // Add more cases for other operators as needed
        default:
          // Unsupported operator
          break;
      }
    }
  });
  return filter;
}

function generateFilterDate(month, year) {
  const monthInt = parseInt(month, 10);
  const yearInt = parseInt(year, 10);

  const startDate = moment(
    `${yearInt}-${monthInt}-01 00:00:00`,
    "YYYY-M-DD HH:mm:ss"
  ).format("YYYY-MM-DD HH:mm:ss");

  // Get the last day of the month at 23:59:59
  const lastDay = moment(`${yearInt}-${monthInt}`, "YYYY-M").daysInMonth(); // Get last day of the month
  const endDate = moment(
    `${yearInt}-${monthInt}-${lastDay} 23:59:59`,
    "YYYY-M-DD HH:mm:ss"
  ).format("YYYY-MM-DD HH:mm:ss");

  return {
    startDate,
    endDate
  }
}

module.exports = {
  generateFilter,
  generateFilterDate,
};
