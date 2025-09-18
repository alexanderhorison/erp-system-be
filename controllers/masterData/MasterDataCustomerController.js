const { yupSchemaValidation, yupSchemaValidationStrict } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const { responses } = require("../../helpers/responses");
const MasterDataCustomerService = require("../../services/masterData/MasterDataCustomerService");

class MasterDataCustomerController {
  static async createCustomer(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama customer harus diisi"),
        phoneNumber: yup.string().optional(),
        email: yup
          .string()
          .required("email harus diisi")
          .email("email tidak sesuai format"),
        address: yup.string().optional(),
        gender: yup.string().optional(),
        notes: yup.string().optional(),
        rankId: yup.number().required("Rank harus diisi"),
        isPosCustomer: yup.boolean().optional(),
        alias: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const newCustomer = await MasterDataCustomerService.create(body);

      res
        .status(201)
        .json(responses(true, "Customer berhasil ditambahkan", newCustomer));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateCustomer(req, res) {
    try {
      const schemaParams = yup.number().required("Id customer kosong");
      const schemaBody = yup.object({
        name: yup.string().required("Nama customer harus diisi"),
        phoneNumber: yup.string().optional(),
        email: yup
          .string()
          .required("email harus diisi")
          .email("email tidak sesuai format"),
        address: yup.string().optional(),
        gender: yup.string().optional(),
        notes: yup.string().optional(),
        alias: yup.string().optional(),
        rankId: yup.number().required("Rank harus diisi"),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const updatedCustomer = await MasterDataCustomerService.update(id, body);
      res
        .status(200)
        .json(responses(true, "Customer berhasil diupdate", updatedCustomer));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteCustomer(req, res) {
    try {
      const schemaParams = yup.number().required("Id customer harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const deletedCustomer = await MasterDataCustomerService.delete(id);

      res
        .status(200)
        .json(responses(true, "Customer sukses dihapus", deletedCustomer));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllCustomer(req, res) {
    try {
      const schemaQuery = yup.object({
        page: yup.string().default("1"),
        limit: yup.string().default("10"),
        search: yup.string().optional(),
        isPosCustomer: yup.boolean().default(false),
        orderBy: yup.string().default("id").oneOf(["id", "name", "createdAt"]),
        orderType: yup.string().default("DESC").oneOf(["ASC", "DESC"]),
      });

      const query = await yupSchemaValidationStrict(req.query, schemaQuery);

      const customer = await MasterDataCustomerService.findAll(query);
      
      res
        .status(200)
        .json(responses(true, "Success get all customer", customer.data, customer.pagination, query));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailCustomer(req, res) {
    try {
      const schemaParams = yup.number().required("Id customer harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataCustomerService.findOne(id);

      res
        .status(200)
        .json(responses(true, "Success get detail customer", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createCustomerAtPos(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama customer harus diisi"),
        phoneNumber: yup.string().optional(),
        email: yup.string().optional().email("email tidak sesuai format"),
        address: yup.string().optional(),
        gender: yup.string().optional(),
        notes: yup.string().optional(),
        rankId: yup.number().required("Rank harus diisi"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      // is pos Customer selalu true
      body.isPosCustomer = true;

      const newCustomer = await MasterDataCustomerService.create(body);

      res
        .status(201)
        .json(responses(true, "Customer berhasil ditambahkan", newCustomer));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllCustomerPos(req, res) {
    try {
      const query = req.query;
      const customer = await MasterDataCustomerService.findAllPosCustomer(query);
      res
        .status(200)
        .json(responses(true, "Success get all customer", customer));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataCustomerController;
