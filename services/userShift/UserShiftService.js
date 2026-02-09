const { Pos_User_Shift, Master_User, Master_Shift } = require("../../models");
const { Op } = require("sequelize");
const moment = require("moment");

class UserShiftService {
  static async startShift(data, user) {
    try {
      const { masterShiftId } = data;
      const userId = user.id;

      // Check if user already has an active shift today
      const today = moment().format("YYYY-MM-DD");
      const existingActiveShift = await Pos_User_Shift.findOne({
        where: {
          userId: userId,
          endShift: null,
          createdAt: {
            [Op.gte]: moment(today).startOf("day").toDate(),
            [Op.lte]: moment(today).endOf("day").toDate(),
          },
        },
      });

      if (existingActiveShift) {
        throw {
          code: 400,
          message:
            "User sudah memiliki shift aktif hari ini. Silakan selesaikan shift terlebih dahulu.",
        };
      }

      // Get master shift info
      const masterShift = await Master_Shift.findByPk(masterShiftId);
      if (!masterShift) {
        throw {
          code: 404,
          message: "Master shift tidak ditemukan",
        };
      }

      // Create new user shift
      const currentTime = moment().format("HH:mm:ss");
      const newUserShift = await Pos_User_Shift.create({
        userId: userId,
        masterShiftId: masterShiftId,
        startShift: currentTime,
        endShift: null,
        totalTransaction: 0,
        grandTotalTransaction: 0,
      });

      // Return with master shift info
      const result = await Pos_User_Shift.findByPk(newUserShift.id, {
        include: [
          {
            model: Master_User,
            attributes: ["id", "name", "userName"],
          },
          {
            model: Master_Shift,
            attributes: ["id", "name", "startShift", "endShift"],
          },
        ],
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getCurrentShift(user) {
    try {
      const userId = user.id;
      const today = moment().format("YYYY-MM-DD");

      // First, check for active shift today
      let currentShift = await Pos_User_Shift.findOne({
        where: {
          userId: userId,
          endShift: null,
          createdAt: {
            [Op.gte]: moment(today).startOf("day").toDate(),
            [Op.lte]: moment(today).endOf("day").toDate(),
          },
        },
        include: [
          {
            model: Master_User,
            attributes: ["id", "name", "userName"],
          },
          {
            model: Master_Shift,
            attributes: ["id", "name", "startShift", "endShift"],
          },
        ],
      });

      // If no shift today, check for active shift from previous days
      if (!currentShift) {
        const previousShift = await Pos_User_Shift.findOne({
          where: {
            userId: userId,
            endShift: null,
            createdAt: {
              [Op.lt]: moment(today).startOf("day").toDate(),
            },
          },
          include: [
            {
              model: Master_User,
              attributes: ["id", "name", "userName"],
            },
            {
              model: Master_Shift,
              attributes: ["id", "name", "startShift", "endShift"],
            },
          ],
          order: [["createdAt", "DESC"]],
        });

        // If found previous shift, it's from a different day
        // According to Case 2: user must select new shift
        if (previousShift) {
          // Return null to indicate user needs to select a new shift
          return null;
        }

        throw {
          code: 404,
          message: "Tidak ada shift aktif untuk hari ini",
        };
      }

      return currentShift;
    } catch (error) {
      throw error;
    }
  }

  static async endShift(user) {
    try {
      const userId = user.id;
      const today = moment().format("YYYY-MM-DD");

      // Find active shift
      const activeShift = await Pos_User_Shift.findOne({
        where: {
          userId: userId,
          endShift: null,
          createdAt: {
            [Op.gte]: moment(today).startOf("day").toDate(),
            [Op.lte]: moment(today).endOf("day").toDate(),
          },
        },
      });

      if (!activeShift) {
        throw {
          code: 404,
          message: "Tidak ada shift aktif untuk diakhiri",
        };
      }

      // End the shift - only record the end time
      const currentTime = moment().format("HH:mm:ss");
      const updatedShift = await activeShift.update({
        endShift: currentTime,
      });

      // Return with complete info
      const result = await Pos_User_Shift.findByPk(updatedShift.id, {
        include: [
          {
            model: Master_User,
            attributes: ["id", "name", "userName"],
          },
          {
            model: Master_Shift,
            attributes: ["id", "name", "startShift", "endShift"],
          },
        ],
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getShiftHistory(user, page = 1, limit = 10) {
    try {
      const userId = user.id;
      const offset = (page - 1) * limit;

      const { count, rows } = await Pos_User_Shift.findAndCountAll({
        where: {
          userId: userId,
        },
        include: [
          {
            model: Master_User,
            attributes: ["id", "name", "userName"],
          },
          {
            model: Master_Shift,
            attributes: ["id", "name", "startShift", "endShift"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: limit,
        offset: offset,
      });

      return {
        data: rows,
        pagination: {
          total: count,
          page: page,
          limit: limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async getAvailableShifts() {
    try {
      const shifts = await Master_Shift.findAll({
        order: [["startShift", "ASC"]],
        attributes: ["id", "name", "startShift", "endShift"],
      });

      return shifts;
    } catch (error) {
      throw error;
    }
  }

  static async getShiftSummary(user) {
    try {
      const userId = user.id;
      const today = moment().format("YYYY-MM-DD");

      // Find active shift
      const activeShift = await Pos_User_Shift.findOne({
        where: {
          userId: userId,
          endShift: null,
          createdAt: {
            [Op.gte]: moment(today).startOf("day").toDate(),
            [Op.lte]: moment(today).endOf("day").toDate(),
          },
        },
        include: [
          {
            model: Master_User,
            attributes: ["id", "name", "userName"],
          },
          {
            model: Master_Shift,
            attributes: ["id", "name", "startShift", "endShift"],
          },
        ],
      });

      if (!activeShift) {
        throw {
          code: 404,
          message: "Tidak ada shift aktif untuk diakhiri",
        };
      }

      // Return shift summary with transaction totals
      return {
        id: activeShift.id,
        shiftName: activeShift.Master_Shift?.name,
        masterShiftStartTime: activeShift.Master_Shift?.startShift,
        masterShiftEndTime: activeShift.Master_Shift?.endShift,
        actualStartTime: activeShift.startShift,
        totalTransaction: activeShift.totalTransaction || 0,
        grandTotalTransaction: activeShift.grandTotalTransaction || 0,
        createdAt: activeShift.createdAt,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserShiftService;
