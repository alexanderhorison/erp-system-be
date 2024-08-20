
const { Op } = require("sequelize");

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
    if (column && operator && value !== undefined && value !== null && value !== '') {
      const target = model ? filter[model] = filter[model] || {} : filter
      switch (operator) {
        case "=":
          target[column] = value;
          break;
        case "!=":
          target[column] = { $ne: value };
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

module.exports = {
  generateFilter,
};
