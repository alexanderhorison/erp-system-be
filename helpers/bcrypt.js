const bcrypt = require("bcrypt");

module.exports = {
    encrypt: (password) => {
        try {
            if (!password || typeof password !== 'string') {
                throw new Error('Invalid password for encryption');
            }
            const salt = bcrypt.genSaltSync(10);
            return bcrypt.hashSync(password, salt);
        } catch (error) {
            console.error('Bcrypt encrypt error:', error);
            throw error;
        }
    },

    compare: async (password, hash) => {
        try {
            if (!password || !hash || typeof password !== 'string' || typeof hash !== 'string') {
                throw new Error('Invalid password or hash for comparison');
            }
            const match = await bcrypt.compare(password, hash);
            return match;
        } catch (error) {
            console.error('Bcrypt compare error:', error);
            throw error;
        }
    }
}

