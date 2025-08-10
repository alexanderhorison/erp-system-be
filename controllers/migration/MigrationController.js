const { responses } = require("../../helpers/responses");
const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const MigrationService = require("../../services/migration/MigrationService");

class MigrationController {
  static async apiMigration(req, res) {
    try {
      const schemaBody = yup.object({
        migrationName: yup.string().required("Nama Migrasi Harus ada"),
      });
      const body = await yupSchemaValidation(req.body, schemaBody);

      const result = await MigrationService.apiMigration(
        body.migrationName
      );

      res
        .status(200)
        .json(
          responses(true, `Migrasi ${body.migrationName} berhasil dilakukan`, result)
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MigrationController;
