const authService = require("../services/auth.service");

exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        const newUser = await authService.register({ name, email, password });
        res.status(201).json(newUser);
    } catch (err) {
        if (err.code === "23505" && err.detail.includes("email")) {
            return res.status(400).json({ error: "Email already exists." });
        }
        console.error("Error during registration:", err.message);
        res.status(500).json({ error: "Server error during registration." });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Missing email or password." });
    }

    try {
        const loginData = await authService.login({ email, password });
        res.json(loginData);
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }

        console.error("Login error:", err.message);
        res.status(500).json({ error: "Server error during login." });
    }
};