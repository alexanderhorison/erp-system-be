const { Category, Type, Unit } = require("../../models");

class MasterDataUnitController {
    static async createUnit(req, res) {
        try {
            const { name, description } = req.body;

            const existingUnit = await Unit.findOne({
                where: { name: name },
            });

            if (existingUnit) {
                throw {
                    code: 400,
                    message: "Nama unit sudah ada dalam database",
                };
            }

            const newUnit = await Unit.create({
                name: name,
                description: description,
            });

            return res.status(201).json({
                success: true,
                message: "Unit berhasil dibuat",
                data: newUnit,
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async updateUnit(req, res) {
        try {
            const unitId = req.params.unitId;
            const { name, description } = req.body;

            const unit = await Unit.findByPk(unitId);

            if (!unit) {
                throw {
                    code: 404,
                    message: "Unit tidak ditemukan",
                };
            }

            const updatedUnit = await unit.update({
                name: name,
                description: description,
            });

            return res.status(200).json({
                success: true,
                message: "Unit berhasil diupdate",
                data: updatedUnit,
            });
        } catch (error) {
            console.log(error);
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async deleteUnit(req, res) {
        try {
            const unitId = req.params.unitId;

            const unit = await Unit.findByPk(unitId);

            if (!unit) {
                return res.status(404).json({
                    success: false,
                    message: "Unit tidak ditemukan",
                });
            }

            const deleteUnit = await Unit.destroy({
                where: { id: unitId },
            });

            return res.status(200).json({
                success: true,
                message: "Unit berhasil dihapus",
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async getAllUnit(req, res) {
        try {
            const data = await Unit.findAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(error.code || 500).json(error.message, error);
        }
    }

    static async getDetailUnit(req, res) {
        try {
            const unitId = req.params.unitId;

            const unit = await Unit.findByPk(unitId);

            if (!unit) {
                throw {
                    code: 404,
                    message: "Unit tidak ditemukan",
                };
            }

            return res.status(200).json({
                success: true,
                data: unit,
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }
}

module.exports = MasterDataUnitController;
