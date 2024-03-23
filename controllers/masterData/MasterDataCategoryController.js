const { Category } = require("../../models");

class MasterDataCategoryController {
    static async createCategory(req, res) {
        try {
            const { name, description } = req.body;

            const existingCategory = await Category.findOne({
                where: { name: name },
            });

            if (existingCategory) {
                throw {
                    code: 400,
                    message: "Nama kategori sudah ada dalam database",
                };
            }

            const newCategory = await Category.create({
                name: name,
                description: description,
            });

            return res.status(201).json({
                success: true,
                message: "Kategori berhasil dibuat",
                data: newCategory,
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async updateCategory(req, res) {
        try {
            const categoryId = req.params.categoryId;
            const { name, description } = req.body;

            const category = await Category.findByPk(categoryId);

            if (!category) {
                throw {
                    code: 404,
                    message: "Kategori tidak ditemukan",
                };
            }

            const updatedCategory = await category.update({
                name: name,
                description: description,
            });

            return res.status(200).json({
                success: true,
                message: "Category updated successfully",
                data: updatedCategory,
            });
        } catch (error) {
            console.log(error);
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async deleteCategory(req, res) {
        try {
            const categoryId = req.params.categoryId;

            const category = await Category.findByPk(categoryId);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: "Kategori tidak ditemukan",
                });
            }

            const deleteCategory = await Category.destroy({
                where: { id: categoryId },
            });

            return res.status(200).json({
                success: true,
                message: "Kategori berhasil dihapus",
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async getAllCategory(req, res) {
        try {
            const data = await Category.findAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(error.code || 500).json(error.message, error);
        }
    }

    static async getDetailCategory(req, res) {
        try {
            const categoryId = req.params.categoryId;

            const category = await Category.findByPk(categoryId);

            if (!category) {
                throw {
                    code: 404,
                    message: "Kategori tidak ditemukan",
                };
            }

            return res.status(200).json({
                success: true,
                data: category,
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }
}

module.exports = MasterDataCategoryController;
