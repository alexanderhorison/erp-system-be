const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const MasterDataWarehouseService = require("../../services/masterData/MasterDataWarehouseService");
const yup = require("yup");

class MasterDataWarehouseController {
  static async createWarehouse(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama gudang harus diisi"),
        location: yup.string().required("Lokasi gudang harus diisi"),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      //! Sementara hardcode sebelum ada middleware
      const user = { id: 1 };

      await MasterDataWarehouseService.create(body, user);

      res.status(201).json(responses(true, "Gudang berhasil ditambahkan"));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateWarehouse(req, res) {
    try {
      const schemaParams = yup.number().required("Id gudang kosong");
      const schemaBody = yup.object({
        id: yup.number().required("Id gudang harus diisi"),
        name: yup.string().required("Nama gudang harus diisi"),
        location: yup.string().required("Lokasi gudang harus diisi"),
        description: yup.string().optional(),
      });

      const warehouseId = await yupSchemaValidation(
        req.params.id,
        schemaParams
      );

      const body = await yupSchemaValidation(req.body, schemaBody);

      const updateWarehouse = await MasterDataWarehouseService.update(
        warehouseId,
        body
      );

      res.status(200).json(responses(true, "Gudang berhasil diubah"));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteWarehouse(req, res) {
    try {
      const schemaParams = yup.number().required("Id gudang harus diisi");
      const warehouseId = await yupSchemaValidation(
        req.params.id,
        schemaParams
      );

      const user = { id: 1 };

      await MasterDataWarehouseService.delete(warehouseId, user);

      res.status(200).json(responses(true, "Gudang berhasil dihapus"));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllWarehouse(req, res) {
    try {
      const data = await MasterDataWarehouseService.findAll();
      res.status(200).json(responses(true, "Sukses Get Data Gudang", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailWarehouse(req, res) {
    try {
      const schemaParams = yup.number().required("Id gudang harus diisi");
      const warehouseId = await yupSchemaValidation(
        req.params.id,
        schemaParams
      );

      const data = await MasterDataWarehouseService.findOne(warehouseId);

      res.status(200).json(responses(true, "Sukses Get Detail", data));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataWarehouseController;
