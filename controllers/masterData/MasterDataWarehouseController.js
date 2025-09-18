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

      const user = req.userData;

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
        status: yup.string().required("Status gudang harus diisi"),
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

      const user = req.userData;

      await MasterDataWarehouseService.delete(warehouseId, user);

      res.status(200).json(responses(true, "Gudang berhasil dihapus"));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllWarehouse(req, res) {
    try {
      const data = await MasterDataWarehouseService.findAll({ query: req.query });
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
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // Create Warehouse Rack
  static async createWarehouseRack(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama rak harus ada"),
        description: yup.string().optional(),
        warehouseId: yup.number().required("Master Warehouse harus ada"),
        data: yup.array().of(
          yup.object().shape({
            key: yup.string().optional(),
            value: yup.string().optional(),
          })
        ),
      });

      const body = await yupSchemaValidation(req.body, schema);

      await MasterDataWarehouseService.createWarehouseRack(body);

      res.status(201).json(responses(true, "Berhasil membuat rak"));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // Update Warehouse Rack
  static async updateWarehouseRack(req, res) {
    try {
      const schemaParams = yup.number().required("Id rak kosong");

      const schemaBody = yup.object({
        warehouseId: yup.number().required("Warehouse harus ada"),
        name: yup.string().required("Nama rak harus ada"),
        description: yup.string().optional(),
        data: yup.array().of(
          yup.object().shape({
            key: yup.string().optional(),
            value: yup.string().optional(),
          })
        ),
      });

      const warehouseRackId = await yupSchemaValidation(
        req.params.id,
        schemaParams
      );

      const body = await yupSchemaValidation(req.body, schemaBody);

      await MasterDataWarehouseService.updateWarehouseRack(
        warehouseRackId,
        body
      );

      res.status(200).json(responses(true, "Rak berhasil diubah"));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllWarehouseRack(req, res) {
    try {
      const schemaParams = yup.number().required("Id rak harus diisi");
      const warehouseId = await yupSchemaValidation(
        req.params.warehouseId,
        schemaParams
      );

      const getAllWarehouseRack =
        await MasterDataWarehouseService.findAllWarehouseRack(warehouseId, req.query);

      res.status(200).json(responses(true, `Berhasil`, getAllWarehouseRack));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailWarehouseRack(req, res) {
    try {
      const schemaParams = yup.number().required("Id rak harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataWarehouseService.getDetailWarehouseRack(id);

      return res
        .status(200)
        .json(responses(true, "Success get detail warehouse rak", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteWarehouseRack(req, res) {
    try {
      const schemaParams = yup.number().required("Id rak harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      await MasterDataWarehouseService.deleteWarehouseRack(id);

      res.status(200).json(responses(true, `Berhasil menghapus rak`));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataWarehouseController;
