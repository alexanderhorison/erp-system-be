const PointOfSaleService = require("../../services/pointOfSale/PointOfSaleService");
const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const ConfigService = require("../../services/config/configService");

class PointOfSaleController {
  static async addOrRemoveFavorite(req, res) {
    try {
      const schema = yup.object({
        productId: yup.number().required("ProductId harus ada"),
        warehouseId: yup.number().required("WarehouseId harus ada"),
        isFavorite: yup.boolean().required("Is Favorit harus ada"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      await PointOfSaleService.addOrRemoveFavorite(body);

      const message =
        body.isFavorite == false ? "Dihilangkan dari" : "Ditambahkan ke";

      res
        .status(200)
        .json(responses(true, `Produk Berhasil ${message} favorite`));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getProductByWarehouseId(req, res) {
    try {
      const schemaParams = yup.object({
        id: yup
          .number()
          .required("Id gudang tidak boleh kosong")
          .typeError("Id gudang harus berupa angka"), // Additional type validation
      });

      const query = await yupSchemaValidation(req.query, schemaParams);

      const data = await PointOfSaleService.getPointOfSaleProductByWarehouse({
        warehouseId: query.id,
      });

      res.status(200).json(responses(true, `Success get product`, data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllProductByProductId(req, res) {
    try {
      const schemaParams = yup.object({
        warehouseId: yup.number().required("Id gudang tidak boleh kosong"),
        productId: yup.number().required("Id produk tidak boleh kosong"),
      });

      const query = await yupSchemaValidation(req.query, schemaParams);

      const data = await PointOfSaleService.getAllProductByProductId(query);

      res.status(200).json(responses(true, `Success get product detail`, data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createPointOfSale(req, res) {
    try {
      const schema = yup.object({
        customerId: yup.number().optional().nullable(),
        subTotal: yup.number().required("Sub Total harus ada"),
        totalDiscount: yup.number().required("Total Discount harus ada"),
        grandTotal: yup.number().required("Grand Total harus ada"),
        totalPayment: yup.number().required("Total Payment harus ada"),
        paymentTypeId: yup.number().required("Tipe Payment harus ada"),
        notes: yup.string().optional(),
        warehouseId: yup.number().required("Warehouse Id harus ada"),
        listProduct: yup
          .array()
          .of(
            yup.object({
              warehouseProductId: yup.number().when("title", (data, schema) => {
                return data[0]
                  ? schema.nullable()
                  : schema.required("Id product warehouse harus diisi");
              }),
              price: yup.number().required("Price product harus diisi"),
              quantity: yup.number().required("Quantity harus diisi"),
              subTotal: yup.number().required("Sub Total Product harus diisi"),
              notes: yup.string().optional(),
              title: yup.string().optional(),
              isDebt: yup.boolean().optional(),
              debtDate: yup.string().optional(),
              totalDebt: yup.number().optional(),
            })
          )
          .required("List point of sale produk harus ada"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const data = await PointOfSaleService.createPointOfSale({
        data: body,
        user,
      });

      res.status(200).json(responses(true, `Berhasil Membuat Sale`, data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getPaymentType(req, res) {
    try {
      const data = await PointOfSaleService.getPaymentType();

      res.status(200).json(responses(true, `Berhasil`, data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllPointOfSaleByWarehouseId(req, res) {
    try {
      const params = req.params;
      const schemaParams = yup
        .string()
        .required("WarehouseId tidak boleh kosong");

      const warehouseId = await yupSchemaValidation(
        params.warehouseId,
        schemaParams
      );

      // saat ini tidak ada params dlu
      const data = await PointOfSaleService.getAllPointOfSaleByWarehouseId(
        warehouseId,
        req.userData.id
      );

      res.status(200).json(responses(true, `Sukses Get All Data`, data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailPointOfSale(req, res) {
    try {
      const params = req.params;

      const schemaParams = yup
        .string()
        .required("Code point of sale harus diisi");

      const code = await yupSchemaValidation(params.code, schemaParams);

      const getDetail = await PointOfSaleService.getDetailPointOfSaleByCode(
        code
      );

      res.status(200).json(responses(true, "Berhasil", getDetail));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllPointOfSaleByCustomerId(req, res) {
    try {
      const schemaParams = yup.object({
        customerId: yup
          .number()
          .required("Id customer tidak boleh kosong")
          .typeError("Id customer harus berupa angka"), // Additional type validation
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const customerId = params.customerId;

      const data = await PointOfSaleService.getAllPointOfSaleByCustomerId(
        customerId
      );

      res.status(200).json(responses(true, "Sukses Get All Data", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async printPos(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code point of sale harus diisi"),
      });

      const targetPrinter = req.body;

      const params = await yupSchemaValidation(req.params, schemaParams);

      const code = params.code;

      //? KIRIM STRING YANG SUDAH DI FORMAT DENGAN \N
      const data = await PointOfSaleService.printPosV3(code);

      const printerServerSetting = await ConfigService.get({
        query: {
          key: "PRINTER_SERVER",
        },
      });

      // Kirim ke print server
      const printServerUrl = `${printerServerSetting.value_json.ip}/print-pos-api/print-file`;
      const printPayload = {
        buffer: data.string,
        printerSetting: targetPrinter,
      };

      const printResponse = await fetch(printServerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(printPayload),
      });

      const printResult = await printResponse.json();

      if (!printResponse.ok) {
        console.error("Print server error:", printResult);
        throw new Error(printResult.message || "Failed to send to printer");
      }

      return res.status(200).json(
        responses(true, "Print job sent successfully", {
          printResult,
          timing: printResult.timing,
        })
      );
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: error.message || error });
    }
  }

  static async runSchedulerReportPos(req, res) {
    try {
      const runScheduler = await PointOfSaleService.runSchedulerReportPos();
      res
        .status(200)
        .json(
          responses(
            true,
            runScheduler?.message || "Berhasil",
            runScheduler?.data || []
          )
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = PointOfSaleController;
