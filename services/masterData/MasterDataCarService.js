const { Tm_Cars } = require("../../models");
const { buildQueryOptions, buildPaginationResponse } = require("../../helpers/queryBuilderHelper");

class MasterDataCarService {
  static async create(data, user) {
    try {
      const { name, description, is_active, emoneyBalance } = data;
      const plate_number = data.plate_number
        ? data.plate_number.toUpperCase().replace(/\s+/g, "")
        : null;

      const existingCar = await Tm_Cars.findOne({
        where: { plate_number: plate_number },
      });

      if (existingCar) {
        throw {
          code: 400,
          message: "Nomor plat kendaraan sudah ada dalam database",
        };
      }

      return Tm_Cars.create({
        name: name,
        plate_number: plate_number,
        description: description,
        is_active: is_active ?? true,
        emoneyBalance: emoneyBalance ?? 0,
      });
    } catch (error) {
      throw error;
    }
  }

  static async update(id, data, user) {
    try {
      const { name, description, is_active, emoneyBalance } = data;
      const plate_number = data.plate_number
        ? data.plate_number.toUpperCase().replace(/\s+/g, "")
        : null;

      const existingCar = await Tm_Cars.findByPk(id);

      if (!existingCar) {
        throw {
          code: 404,
          message: "Kendaraan tidak ditemukan",
        };
      }

      // Check if plate number already exists for other car
      if (plate_number !== existingCar.plate_number) {
        const duplicatePlate = await Tm_Cars.findOne({
          where: { plate_number: plate_number },
        });

        if (duplicatePlate) {
          throw {
            code: 400,
            message: "Nomor plat kendaraan sudah ada dalam database",
          };
        }
      }

      const updatedCar = await existingCar.update({
        name: name,
        plate_number: plate_number,
        description: description,
        is_active: is_active,
        emoneyBalance: emoneyBalance,
      });

      return updatedCar;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id, user) {
    try {
      const car = await Tm_Cars.findByPk(id);

      if (!car) {
        throw {
          code: 404,
          message: "Kendaraan tidak ditemukan",
        };
      }

      // Update is_active to false instead of deleting the record
      const updatedCar = await car.update({
        is_active: false,
      });

      return updatedCar;
    } catch (error) {
      throw error;
    }
  }

  static async findAll(query) {
    try {
      const { active } = query;

      // Build query options using helper
      const queryOptions = buildQueryOptions(query, {
        searchFields: ['name', 'plate_number', 'description'],
        additionalWhere: {
          ...(active !== undefined && { is_active: active }),
        },
        enableDate: false,
      });

      const data = await Tm_Cars.findAndCountAll({
        where: queryOptions.where,
        order: queryOptions.order.length > 0 ? queryOptions.order : [
          ['is_active', 'DESC'], // Active cars first
          ['name', 'ASC'], // Then sort by name alphabetically
        ],
        limit: queryOptions.limit,
        offset: queryOptions.offset,
      });

      const result = data.rows.map((item) => ({
        id: item.id,
        name: item.name,
        plate_number: item.plate_number,
        description: item.description,
        is_active: item.is_active,
        emoneyBalance: item.emoneyBalance,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      return {
        data: result,
        pagination: buildPaginationResponse(data, query),
      };
    } catch (error) {
      throw error;
    }
  }

  static async findOne(id) {
    try {
      const car = await Tm_Cars.findByPk(id);

      if (!car) {
        throw {
          code: 404,
          message: "Kendaraan tidak ditemukan",
        };
      }

      const result = {
        id: car.id,
        name: car.name,
        plate_number: car.plate_number,
        description: car.description,
        is_active: car.is_active,
        emoneyBalance: car.emoneyBalance,
        createdAt: car.createdAt,
        updatedAt: car.updatedAt,
      };

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataCarService;
