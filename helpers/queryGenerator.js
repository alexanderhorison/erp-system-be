
const { Op } = require("sequelize");

function generateFilter(filters) {
  const filter = {};
  filters.forEach(({ column, operator, value }) => {
    if (column && operator && value !== undefined && value !== null && value !== '') {
      switch (operator) {
        case "=":
          filter[column] = value;
          break;
        case "!=":
          filter[column] = { $ne: value };
          break;
        case "contains":
          filter[column] = { $regex: `.*${value}.*`, $options: "i" };
          break;
        // Handle "active" status where deletedAt is null
        case "active":
          filter[column] = { [Op.eq]: null };
          break;
        // Handle "not active" status where deletedAt is not null
        case "notActive":
          filter[column] = { [Op.not]: null };
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

module.exports = {
  generateFilter,
};
