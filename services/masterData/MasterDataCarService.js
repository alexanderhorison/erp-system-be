const { Tm_Cars } = require("../../models");
const { Op } = require("sequelize");

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
      const { 
        active, 
        page = 1, 
        pageSize = 10, 
        search = "",
        sortBy = "name",
        sortOrder = "ASC"
      } = query;

      let whereConditions = {};

      // Filter by active status
      if (active !== undefined) {
        whereConditions.is_active = active;
      }

      // Add search functionality
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { plate_number: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      // Define valid sort fields
      const validSortFields = ['name', 'plate_number', 'is_active', 'createdAt', 'updatedAt'];
      const orderField = validSortFields.includes(sortBy) ? sortBy : 'name';
      const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const { count, rows } = await Tm_Cars.findAndCountAll({
        where: whereConditions,
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize),
        order: [[orderField, orderDirection]],
      });

      const result = rows.map((item) => ({
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
        pagination: {
          total: count,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(count / parseInt(pageSize)),
        },
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
