const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

exports.register = async ({ name, email, password }) => {
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await db.query(
            `INSERT INTO public.users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email`,
            [name, email, hashedPassword]
        );
        return result.rows[0];
    } catch (err) {
        throw err;
    }
};

exports.login = async ({ email, password }) => {
    const result = await db.query(
        `SELECT * FROM public.users WHERE email = $1`,
        [email]
    );

    if (result.rows.length === 0) {
        const error = new Error("User not found");
        error.status = 400;
        throw error;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
        const error = new Error("Invalid password");
        error.status = 401;
        throw error;
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    };
};