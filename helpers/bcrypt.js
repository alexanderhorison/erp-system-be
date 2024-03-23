const bcrypt = require("bcrypt");

module.exports = {
    encrypt: (password) => {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt)
    },

    compare: async (password, hash) => {
        const match = await bcrypt.compare(password, hash)
        return match
    }
}

