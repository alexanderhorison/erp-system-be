const { Category, Type } = require("../../models");

class MasterDataTypeController {
    static async createType(req, res) {
        try {
            const { name, description } = req.body;

            const existingType = await Type.findOne({
                where: { name: name },
            });

            if (existingType) {
                throw {
                    code: 400,
                    message: "Nama tipe sudah ada dalam database",
                };
            }

            const newType = await Type.create({
                name: name,
                description: description,
            });

            return res.status(201).json({
                success: true,
                message: "Tipe berhasil dibuat",
                data: newType,
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async updateType(req, res) {
        try {
            const typeId = req.params.typeId;
            const { name, description } = req.body;

            const type = await Type.findByPk(typeId);

            if (!type) {
                throw {
                    code: 404,
                    message: "Tipe tidak ditemukan",
                };
            }

            const updatedType = await type.update({
                name: name,
                description: description,
            });

            return res.status(200).json({
                success: true,
                message: "Tipe berhasil diupdate",
                data: updatedType,
            });
        } catch (error) {
            console.log(error);
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async deleteType(req, res) {
        try {
            const typeId = req.params.typeId;

            const type = await Type.findByPk(typeId);

            if (!type) {
                return res.status(404).json({
                    success: false,
                    message: "Tipe tidak ditemukan",
                });
            }

            const deleteType = await Type.destroy({
                where: { id: typeId },
            });

            return res.status(200).json({
                success: true,
                message: "Tipe berhasil dihapus",
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async getAllType(req, res) {
        try {
            const data = await Type.findAll();
            const result = data.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description
            }))
            res.status(200).json({ data: result });
        } catch (error) {
            res.status(error.code || 500).json(error.message, error);
        }
    }

    static async getDetailType(req, res) {
        try {
            const typeId = req.params.typeId;

            const type = await Type.findByPk(typeId);

            if (!type) {
                throw {
                    code: 404,
                    message: "Tipe tidak ditemukan",
                };
            }

            const result = {
                id: type.id,
                name: type.name,
                description: type.description
            }

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }
}

module.exports = MasterDataTypeController;
