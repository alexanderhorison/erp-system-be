const moment = require("moment");
const { Op } = require("sequelize");

function buildQueryOptions(query, options = {}) {
  const {
    searchFields = [],
    statusField = null,
    dateField = "createdAt",
    enableDate,
    additionalWhere = {},
  } = options;

  const whereClause = { ...additionalWhere };

  if (query?.status !== undefined && statusField) {
    whereClause[statusField] = query.status;
  }

  if (query?.search && searchFields.length > 0) {
    const orConditions = searchFields.map((field) => ({
      [field]: { [Op.iLike]: `%${query.search}%` },
    }));
    whereClause[Op.or] = orConditions;
  }

  // Handle date filtering - prioritize dateFrom/dateTo over single date
  if (enableDate) {
    if (query?.dateFrom || query?.dateTo) {
      // Handle date range filtering with dateFrom and dateTo
      const dateCondition = {};

      if (query?.dateFrom) {
        // Format: YYYY-MM-DD 00:00:00
        dateCondition[Op.gte] = new Date(query.dateFrom + "T00:00:00.000Z");
      }

      if (query?.dateTo) {
        // Format: YYYY-MM-DD 23:59:59
        dateCondition[Op.lte] = new Date(query.dateTo + "T23:59:59.999Z");
      }

      whereClause[dateField] = dateCondition;
    } else if (query?.date) {
      // Handle single date filtering (fallback)
      const formattedDate = moment(query.date, "DD-MM-YYYY").format(
        "YYYY-MM-DD"
      );
      whereClause[dateField] = {
        [Op.gte]: formattedDate,
        [Op.lt]: moment(formattedDate).add(1, "days").format("YYYY-MM-DD"),
      };
    }
  }

  // Bangun order dinamis
  const orderBy = query?.orderBy;
  const orderType = query?.orderType;
  const order = orderBy ? [[orderBy, orderType || "DESC"]] : [["id", "DESC"]];

  if (query.paginate === false) {
    return {
      where: whereClause,
      order,
    };
  }

  // Bangun pagination dinamis
  const limit = query?.limit ? parseInt(query.limit) : 10; // Default limit
  const page = query?.page ? parseInt(query.page) : 1; // Default page
  const offset = (page - 1) * limit;

  return {
    where: whereClause,
    order,
    limit,
    offset,
  };
}

function buildPaginationResponse(allData, query) {
  if (!query || query.paginate === false) {
    return {
      total: allData.count,
    };
  }
  const limit = query?.limit ? parseInt(query.limit) : 10;
  const page = query?.page ? parseInt(query.page) : 1;
  return {
    total: allData.count,
    page,
    limit,
    totalPage: Math.ceil(allData.count / limit),
  };
}

module.exports = {
  buildQueryOptions,
  buildPaginationResponse,
};
