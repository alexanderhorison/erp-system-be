const {
    Master_Product,
    Type,
    Category,
    Master_Product_History,
} = require("../../models");
const { Op } = require("sequelize");

class MasterDataProductController {
    static async createProduct(req, res) {
        try {
            const { name, description, CategoryId, TypeId, image } =
                req.body;

            const existingProduct = await Master_Product.findOne({
                where: { name: name },
            });

            if (existingProduct) {
                throw {
                    code: 400,
                    message: "Nama produk sudah ada dalam database",
                };
            }

            const newProduct = await Master_Product.create({
                name: name,
                description: description,
                CategoryId: CategoryId,
                TypeId: TypeId,
                image: image,
            });

            // await Master_Product_History.create({
            //     name: "Create",
            //     data_before: JSON.stringify(existingProduct),
            //     data_after: JSON.stringify(newProduct),
            //     UserId: 1, //! Hardcode sementara
            // });

            return res.status(201).json({
                success: true,
                message: "Produk berhasil dibuat",
                data: newProduct,
            });
        } catch (error) {
            console.log(error);
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async updateProduct(req, res) {
        try {
            const productId = req.params.productId;
            const { name, description, CategoryId, TypeId, is_active, image } =
                req.body;

            const existingProduct = await Master_Product.findByPk(productId);

            if (!existingProduct) {
                throw {
                    code: 404,
                    message: "Produk tidak ditemukan",
                };
            }

            const updatedProduct = await existingProduct.update({
                name: name,
                description: description,
                CategoryId: CategoryId,
                TypeId: TypeId,
                is_active: is_active,
                image: image || null,
            });

            await Master_Product_History.create({
                name: "Update",
                data_before: JSON.stringify(existingProduct),
                data_after: JSON.stringify(updatedProduct),
                UserId: 1, //! Hardcode sementara
            });

            return res.status(200).json({
                success: true,
                message: "Product updated successfully",
                data: updatedProduct,
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async deleteProduct(req, res) {
        try {
            const productId = req.params.productId;

            const product = await Master_Product.findByPk(productId);

            if (!product) {
                return res
                    .status(404)
                    .json({ success: false, message: "Product not found" });
            }

            const deleteProduct = await Master_Product.destroy({
                where: { id: productId },
            });

            await Master_Product_History.create({
                name: "Delete",
                data_before: JSON.stringify(product),
                data_after: JSON.stringify(deleteProduct),
                UserId: 1, //! Hardcode sementara
            });

            return res.status(200).json({
                success: true,
                message: "Product deleted successfully",
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }

    static async getAllProduct(req, res) {
        try {
            const data = await Master_Product.findAll({
                include: [
                    {
                        model: Type,
                    },
                    {
                        model: Category,
                    },
                ],
            });
            res.status(200).json(data);
        } catch (error) {
            res.status(error.code || 500).json(error.message, error);
        }
    }

    static async getDetailProduct(req, res) {
        try {
            const productId = req.params.productId;

            const product = await Master_Product.findByPk(productId, {
                include: [Category, Type],
            });

            if (!product) {
                throw {
                    code: 404,
                    message: "Produk tidak ditemukan",
                };
            }

            return res.status(200).json({
                success: true,
                data: product,
            });
        } catch (error) {
            return res
                .status(error.code || 500)
                .json({ success: false, message: error.message });
        }
    }
}

module.exports = MasterDataProductController;
