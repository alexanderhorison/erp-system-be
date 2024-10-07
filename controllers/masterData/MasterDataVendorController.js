const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const { responses } = require("../../helpers/responses");
const MasterDataVendorService = require('../../services/masterData/MasterDataVendorService');

class MasterDataVendorController {
  static async createVendor(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama vendor harus diisi"),
        phoneNumber: yup.string().optional(),
        email: yup
          .string()
          .required("email harus diisi")
          .email("email tidak sesuai format"),
        address: yup.string().optional(),
        gender: yup.string().optional(),
        notes: yup.string().optional(),
        rankId: yup.number().required("Rank harus diisi"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const newVendor = await MasterDataVendorService.create(body);

      res
        .status(201)
        .json(responses(true, "Vendor berhasil ditambahkan", newVendor));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateVendor(req, res) {
    try {
      const schemaParams = yup.number().required("Id vendor kosong");
      const schemaBody = yup.object({
        name: yup.string().required("Nama vendor harus diisi"),
        phoneNumber: yup.string().optional(),
        email: yup
          .string()
          .required("email harus diisi")
          .email("email tidak sesuai format"),
        address: yup.string().optional(),
        gender: yup.string().optional(),
        notes: yup.string().optional(),
        rankId: yup.number().required("Rank harus diisi"),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const updatedVendor = await MasterDataVendorService.update(id, body);
      res
        .status(200)
        .json(responses(true, "Vendor berhasil diupdate", updatedVendor));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteVendor(req, res) {
    try {
      const schemaParams = yup.number().required("Id vendor harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const deletedVendor = await MasterDataVendorService.delete(id);

      res
        .status(200)
        .json(responses(true, "Vendor sukses dihapus", deletedVendor));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllVendor(req, res) {
    try {
      const vendor = await MasterDataVendorService.findAll();
      res
        .status(200)
        .json(responses(true, "Success get all vendor", vendor));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailVendor(req, res) {
    try {
      const schemaParams = yup.number().required("Id vendor harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataVendorService.findOne(id);

      res
        .status(200)
        .json(responses(true, "Success get detail vendor", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataVendorController;
