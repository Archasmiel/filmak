const db = require('../db');

// FIND USER BY EMAIL
const findUserByEmail = async (email) => {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0]; // Return single user
};

// FIND USER BY ID
const findUserById = async (id) => {
    const result = await db.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    return result.rows[0];
};

// CREATE USER
const createUser = async (name, email, hashedPassword) => {
    const query = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id`;
    const result = await db.query(query, [name, email, hashedPassword]);
    return result.rows[0].id;
};


module.exports = {
    findUserByEmail,
    findUserById,
    createUser,
};
