const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const MasterDataShiftService = require("../../services/masterData/MasterDataShiftService");
const { responses } = require("../../helpers/responses");

class MasterDataShiftController {
  static async createShift(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama shift harus diisi"),
        startShift: yup.string().required("Jam mulai shift harus diisi").matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam mulai tidak valid (HH:MM)"),
        endShift: yup.string().required("Jam selesai shift harus diisi").matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam selesai tidak valid (HH:MM)"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const newShift = await MasterDataShiftService.create(body, user);

      res
        .status(201)
        .json(responses(true, "Shift berhasil ditambahkan", newShift));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateShift(req, res) {
    try {
      const schemaParams = yup.number().required("Id shift kosong");
      const schemaBody = yup.object({
        id: yup.number().required("Id shift harus diisi"),
        name: yup.string().required("Nama shift harus diisi"),
        startShift: yup.string().required("Jam mulai shift harus diisi").matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam mulai tidak valid (HH:MM)"),
        endShift: yup.string().required("Jam selesai shift harus diisi").matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam selesai tidak valid (HH:MM)"),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const user = req.userData;

      const updatedShift = await MasterDataShiftService.update(
        id,
        body,
        user
      );
      res
        .status(200)
        .json(responses(true, "Shift berhasil diubah", updatedShift));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteShift(req, res) {
    try {
      const schemaParams = yup.number().required("Id shift harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const user = req.userData;

      const deletedShift = await MasterDataShiftService.delete(id, user);

      res
        .status(200)
        .json(responses(true, "Shift berhasil dihapus", deletedShift));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllShift(req, res) {
    try {
      const shift = await MasterDataShiftService.findAll();
      res
        .status(200)
        .json(responses(true, "Success get all shift", shift));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailShift(req, res) {
    try {
      const schemaParams = yup.number().required("Id shift harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataShiftService.findOne(id);

      res
        .status(200)
        .json(responses(true, "Success get detail shift", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataShiftController;