const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const { responses } = require("../../helpers/responses");
const MasterDataEmployeeService = require("../../services/masterData/MasterDataEmployeeService");

class MasterEmployeeController {
  static async createEmployee(req, res) {
    try {
      const schema = yup.object({
        nama: yup.string().required("Nama karyawan harus diisi"),
        phone: yup.string().optional().nullable(),
        address: yup.string().optional().nullable(),
        dob: yup.date().optional().nullable(),
        sex: yup.string().optional().nullable(),
        role: yup.string().optional().nullable(),
        status: yup.string().optional().nullable(),
        salary: yup.number().optional().nullable(),
        bonus: yup.number().optional().nullable(),
        is_active: yup.boolean().optional().nullable(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const newEmployee = await MasterDataEmployeeService.create(body);

      res
        .status(201)
        .json(responses(true, "Karyawan berhasil ditambahkan", newEmployee));
    } catch (error) {
      console.log(error);

      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateEmployee(req, res) {
    try {
      const schemaParams = yup.number().required("Id karyawan kosong");
      const schemaBody = yup.object({
        nama: yup.string().optional().nullable(),
        phone: yup.string().optional().nullable(),
        address: yup.string().optional().nullable(),
        dob: yup.date().optional().nullable(),
        sex: yup.string().optional().nullable(),
        role: yup.string().optional().nullable(),
        status: yup.string().optional().nullable(),
        salary: yup.number().optional().nullable(),
        bonus: yup.number().optional().nullable(),
        is_active: yup.boolean().optional().nullable(),
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
      const schemaQuery = yup.object({
        active: yup.boolean().optional(),
      });
      const query = await yupSchemaValidation(req.query, schemaQuery);

      const employees = await MasterDataEmployeeService.findAll(query);
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

  static async createTrxEmployeeDebt(req, res) {
    try {
      const schemaParams = yup.number().required("Id karyawan kosong");
      const schemaBody = yup.object({
        date: yup.date().required('Date is required'),
        type: yup.string().required('Type is required')
          .oneOf(['PEMBAYARAN', 'PEMINJAMAN'], 'Type harus PEMBAYARAN or PEMINJAMAN'),
        category: yup.string().required('Category is required')
          .oneOf(['MANUAL'], 'Category harus MANUAL'),
        amount: yup.number().required('Amount is required').positive('Amount must be positive'),
        dailyCostEmployeeId: yup.number().nullable(),
        notes: yup.string().nullable()
      })

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const result = await MasterDataEmployeeService.createTransaction(body, id);

      res.status(201).json(responses(true, "Berhasil membuat transaksi hutang/piutang", result));
    } catch (err) {
      res.status(err.code || 500).json(responses(false, err.message));
    }
  }

  static async getAllTrxEmployeeDebt(req, res) {
    try {
      const schemaParams = yup.number().required("Id karyawan harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const query = req.query

      const result = await MasterDataEmployeeService.getAllTransactions(query, id);

      res.json(responses(true, "Berhasil mendapatkan data hutang", result));
    } catch (err) {
      res.status(err.code || 500).json(responses(false, err.message));
    }
  }

  static async deleteTrxEmployeeDebt(req, res) {
    try {
      const schemaParams = yup.number().required("Id Transaksi hutang/piutang harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const result = await MasterDataEmployeeService.deleteTransaction(id);

      res.json(responses(true, "Berhasil menghapus transaksi hutang", result));
    } catch (err) {
      res.status(err.code || 500).json(responses(false, err.message));
    }
  }
}

module.exports = MasterEmployeeController;
