const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const { responses } = require("../../helpers/responses");
const MasterDataEmployeeService = require("../../services/masterData/MasterDataEmployeeService");

class MasterEmployeeController {
  static async createEmployee(req, res) {
    try {
      const schema = yup.object({
        nama: yup.string().required("Nama karyawan harus diisi"),
        phone: yup.string().optional(),
        address: yup.string().optional(),
        dob: yup.date().optional(),
        sex: yup.string().optional(),
        role: yup.string().optional(),
        status: yup.string().optional(),
        salary: yup.number().optional(),
        bonus: yup.number().optional(),
        is_active: yup.boolean().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const newEmployee = await MasterDataEmployeeService.create(body);

      res
        .status(201)
        .json(responses(true, "Karyawan berhasil ditambahkan", newEmployee));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateEmployee(req, res) {
    try {
      const schemaParams = yup.number().required("Id karyawan kosong");
      const schemaBody = yup.object({
        nama: yup.string().optional(),
        phone: yup.string().optional(),
        address: yup.string().optional(),
        dob: yup.date().optional(),
        sex: yup.string().optional(),
        role: yup.string().optional(),
        status: yup.string().optional(),
        salary: yup.number().optional(),
        bonus: yup.number().optional(),
        is_active: yup.boolean().optional(),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const updatedEmployee = await MasterDataEmployeeService.update(id, body);
      res
        .status(200)
        .json(responses(true, "Karyawan berhasil diupdate", updatedEmployee));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteEmployee(req, res) {
    try {
      const schemaParams = yup.number().required("Id karyawan harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const deletedEmployee = await MasterDataEmployeeService.delete(id);

      res
        .status(200)
        .json(responses(true, "Karyawan berhasil dihapus", deletedEmployee));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllEmployees(req, res) {
    try {
      const employees = await MasterDataEmployeeService.findAll();
      res
        .status(200)
        .json(responses(true, "Success get all employees", employees));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailEmployee(req, res) {
    try {
      const schemaParams = yup.number().required("Id karyawan harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataEmployeeService.findOne(id);

      res
        .status(200)
        .json(responses(true, "Success get detail employee", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterEmployeeController;
