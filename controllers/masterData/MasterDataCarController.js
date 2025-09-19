const { yupSchemaValidation, yupSchemaValidationStrict } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const MasterDataCarService = require("../../services/masterData/MasterDataCarService");
const { responses } = require("../../helpers/responses");

class MasterDataCarController {
  static async createCar(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama kendaraan harus diisi"),
        plate_number: yup.string().required("Nomor plat kendaraan harus diisi"),
        description: yup.string().optional(),
        is_active: yup.boolean().default(true).optional(),
        emoneyBalance: yup.number().default(0).optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);
      const user = req.userData;
      const newCar = await MasterDataCarService.create(body, user);

      res
        .status(201)
        .json(responses(true, "Kendaraan berhasil ditambahkan", newCar));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateCar(req, res) {
    try {
      const schemaParams = yup.number().required("Id kendaraan kosong");
      const schemaBody = yup.object({
        name: yup.string().required("Nama kendaraan harus diisi"),
        plate_number: yup.string().required("Nomor plat kendaraan harus diisi"),
        description: yup.string().optional(),
        is_active: yup.boolean().required("Status aktif harus diisi"),
        emoneyBalance: yup.number().optional(),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const user = req.userData;

      const updatedCar = await MasterDataCarService.update(id, body, user);
      res
        .status(200)
        .json(responses(true, "Kendaraan berhasil diubah", updatedCar));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteCar(req, res) {
    try {
      const schemaParams = yup.number().required("Id kendaraan harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const user = req.userData;

      const deletedCar = await MasterDataCarService.delete(id, user);

      res
        .status(200)
        .json(responses(true, "Kendaraan berhasil dihapus", deletedCar));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllCars(req, res) {
    try {
      const schemaQuery = yup.object({
        page: yup.string().default("1"),
        limit: yup.string().default("10"),
        search: yup.string().optional(),
        active: yup.boolean().optional(),
        orderBy: yup.string().default("id").oneOf(["id", "name", "plate_number", "createdAt", "is_active"]),
        orderType: yup.string().default("DESC").oneOf(["ASC", "DESC"]),
      });

      const query = await yupSchemaValidationStrict(req.query, schemaQuery);

      const cars = await MasterDataCarService.findAll(query);
      
      res
        .status(200)
        .json(
          responses(true, "Berhasil mendapatkan semua data kendaraan", cars.data, cars.pagination, query)
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailCar(req, res) {
    try {
      const schemaParams = yup.number().required("Id kendaraan harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataCarService.findOne(id);

      res
        .status(200)
        .json(responses(true, "Berhasil mendapatkan detail kendaraan", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataCarController;
