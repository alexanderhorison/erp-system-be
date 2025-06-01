const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const { responses } = require("../../helpers/responses");
const DailyCostService = require("../../services/dailyCost/DailyCostService");
const moment = require("moment");

class DailyCostController {
  static async createDailyCost(req, res) {
    try {
      const schema = yup.object({
        date: yup.date().required("Tanggal harus diisi"),
        notes: yup.string().optional(),
        status: yup.string().default("APPROVED").optional(),
        grandTotal: yup.number().default(0).optional(),
        totalCostGeneral: yup.number().default(0).optional(),
        totalCostEmployee: yup.number().default(0).optional(),
        totalCostUnexpected: yup.number().default(0).optional(),
        costGenerals: yup
          .array()
          .of(
            yup.object({
              salesOrderId: yup.number().required("ID sales order harus diisi"),
              depositBalance: yup.number().nullable(),
              driverId: yup.number().nullable(),
              carsId: yup.number().nullable(),
              eMoneyBalance: yup.number().nullable(),
              latestEMoneyBalance: yup.number().nullable(),
              remainingEMoneyBalance: yup.number().nullable(),
              tollCost: yup.number().default(0).optional(),
              fuelCost: yup.number().default(0).optional(),
              transportAllowance: yup.number().default(0).optional(),
              remainingDepositBalance: yup.number().nullable(),
            })
          )
          .optional(),
        costEmployees: yup
          .array()
          .of(
            yup.object({
              employeeId: yup.number().required("ID karyawan harus diisi"),
              employeeName: yup.string().required("Nama karyawan harus diisi"),
              salary: yup.number().required("Gaji harus diisi"),
              bonus: yup.number().default(0).optional(),
              amountDebt: yup.number().default(0).optional(),
              amountDebtPaid: yup.number().default(0).optional().when("salary", (salary, schema) =>
                schema.test(
                  "debt-paid-not-more-than-salary",
                  "Jumlah pembayaran hutang tidak boleh melebihi gaji",
                  function (amountDebtPaid) {
                    if (amountDebtPaid > 0 && salary !== undefined) {
                      return amountDebtPaid <= salary;
                    }
                    return true;
                  }
                )
              ),
              notes: yup.string().optional()
            })
          )
          .optional(),
        costUnexpecteds: yup
          .array()
          .of(
            yup.object({
              categoryId: yup
                .number()
                .required("ID kategori biaya tidak terduga harus diisi"),
              description: yup.string().optional(),
              price: yup.number().required("Jumlah harus diisi"),
            })
          )
          .optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);
      const user = req.userData;
      const newDailyCost = await DailyCostService.create(body, user);

      res
        .status(201)
        .json(responses(true, "Daily Cost berhasil ditambahkan", newDailyCost));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateDailyCost(req, res) {
    try {
      const schemaParams = yup.date().required("Tanggal harus diisi");

      const schemaBody = yup.object({
        date: yup.date().required("Tanggal harus diisi"),
        notes: yup.string().optional(),
        status: yup.string().default("APPROVED").optional(),
        grandTotal: yup.number().default(0).optional(),
        totalCostGeneral: yup.number().default(0).optional(),
        totalCostEmployee: yup.number().default(0).optional(),
        totalCostUnexpected: yup.number().default(0).optional(),
        costGenerals: yup
          .array()
          .of(
            yup.object({
              salesOrderId: yup.number().required("ID sales order harus diisi"),
              depositBalance: yup.number().nullable(),
              driverId: yup.number().nullable(),
              carsId: yup.number().nullable(),
              eMoneyBalance: yup.number().nullable(),
              latestEMoneyBalance: yup.number().nullable(),
              remainingEMoneyBalance: yup.number().nullable(),
              tollCost: yup.number().default(0).optional(),
              fuelCost: yup.number().default(0).optional(),
              transportAllowance: yup.number().default(0).optional(),
              remainingDepositBalance: yup.number().nullable(),
            })
          )
          .optional(),
        costEmployees: yup
          .array()
          .of(
            yup.object({
              employeeId: yup.number().required("ID karyawan harus diisi"),
              employeeName: yup.string().required("Nama karyawan harus diisi"),
              salary: yup.number().required("Gaji harus diisi"),
              bonus: yup.number().default(0).optional(),
              amountDebt: yup.number().default(0).optional(),
              amountDebtPaid: yup.number().default(0).optional().when("salary", (salary, schema) =>
                schema.test(
                  "debt-paid-not-more-than-salary",
                  "Jumlah pembayaran hutang tidak boleh melebihi gaji",
                  function (amountDebtPaid) {
                    if (amountDebtPaid > 0 && salary !== undefined) {
                      return amountDebtPaid <= salary;
                    }
                    return true;
                  }
                )
              ),
              notes: yup.string().optional()
            })
          )
          .optional(),
        costUnexpecteds: yup
          .array()
          .of(
            yup.object({
              categoryId: yup
                .number()
                .required("ID kategori biaya tidak terduga harus diisi"),
              description: yup.string().optional(),
              price: yup.number().required("Jumlah harus diisi"),
            })
          )
          .optional(),
      });

      const date = await yupSchemaValidation(req.params.date, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const user = req.userData;

      const updatedDailyCost = await DailyCostService.update(date, body, user);
      res
        .status(200)
        .json(responses(true, "Daily Cost berhasil diubah", updatedDailyCost));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteDailyCost(req, res) {
    try {
      const schemaParams = yup.date().required("Tanggal harus diisi");
      const date = await yupSchemaValidation(req.params.date, schemaParams);
    
      const user = req.userData;

      const deletedDailyCost = await DailyCostService.delete(date, user);

      res
        .status(200)
        .json(responses(true, "Daily Cost berhasil dihapus", deletedDailyCost));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllDailyCosts(req, res) {
    try {
      const schemaQuery = yup.object({
        startDate: yup.date().optional(),
        endDate: yup.date().optional(),
        status: yup.string().optional(),
      });
      const query = await yupSchemaValidation(req.query, schemaQuery);
      const dailyCosts = await DailyCostService.findAll(query);
      res
        .status(200)
        .json(
          responses(
            true,
            "Berhasil mendapatkan semua data daily cost",
            dailyCosts
          )
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailDailyCost(req, res) {
    try {
      const schemaParams = yup.date().required("Tanggal harus diisi");
      const date = await yupSchemaValidation(req.params.date, schemaParams);
      const data = await DailyCostService.findOne(date);

      res
        .status(200)
        .json(responses(true, "Berhasil mendapatkan detail daily cost", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDailyCostByDate(req, res) {
    try {
      const schemaQuery = yup.object({
        date: yup.date().required("Tanggal harus diisi"),
      });
      const query = await yupSchemaValidation(req.query, schemaQuery);

      // Get all daily costs for the month with calculated grandTotal
      const data = await DailyCostService.findByMonth({
        date: query.date,
      });

      res
        .status(200)
        .json(
          responses(
            true,
            "Berhasil mendapatkan daily cost berdasarkan bulan",
            data
          )
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = DailyCostController;
