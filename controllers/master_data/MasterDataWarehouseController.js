const {
    Warehouse,
} = require("../../models");

class MasterDataWarehouseController {
    static async createWarehouse(req, res) {
        try {
            const { name, description, location } = req.body;

            const existingWarehouse = await Warehouse.findOne({
                where: { name: name },
            });

            if (existingWarehouse) {
                throw {
                    code: 400,
                    message: "Nama gudang sudah ada dalam database",
                };
            }

            const newWarehouse = await Warehouse.create({
                name: name,
                description: description,
                location: location,
            });

            return res.status(201).json({
                success: true,
                message: "Gudang berhasil dibuat",
                data: newWarehouse,
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async updateWarehouse(req, res) {
        try {
            const warehouseId = req.params.warehouseId;
            const { name, description, location } =
                req.body;

            const existingWarehouse = await Warehouse.findByPk(warehouseId);

            if (!existingWarehouse) {
                throw {
                    code: 404,
                    message: "Gudang tidak ditemukan",
                };
            }

            const updatedWarehouse = await existingWarehouse.update({
                name: name,
                description: description,
                location: location,
            });

            return res.status(200).json({
                success: true,
                message: "Gudang berhasil diupdate",
                data: updatedWarehouse,
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async deleteWarehouse(req, res) {
        try {
            const warehouseId = req.params.warehouseId;

            const warehouse = await Warehouse.findByPk(warehouseId);

            if (!warehouse) {
                return res
                    .status(404)
                    .json({ success: false, message: "Gudang tidak ditemukan" });
            }

            const deleteWarehouse = await Warehouse.destroy({
                where: { id: warehouseId },
            });

            return res.status(200).json({
                success: true,
                message: "Gudang berhasil dihapus",
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async getAllWarehouse(req, res) {
        try {
            const data = await Warehouse.findAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(error.code || 500).json(error.message, error);
        }
    }

    static async getDetailWarehouse(req, res) {
        try {
            const warehouseId = req.params.warehouseId;

            const warehouse = await Warehouse.findByPk(warehouseId);

            if (!warehouse) {
                throw {
                    code: 404,
                    message: "Gudang tidak ditemukan",
                };
            }

            return res.status(200).json({
                success: true,
                data: warehouse,
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }
}

module.exports = MasterDataWarehouseController;
