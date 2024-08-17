require ('dotenv').config();
const mysql = require('mysql');
const jsonwebtoken = require('jsonwebtoken');
const JWT_SECRET  = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(401).json({ error: "user not logged in" });
    }
    const token = authorization.replace("Bearer ", "");
    jsonwebtoken.verify(token, JWT_SECRET, (error, payload) => {
        if (error) {
            return res.status(401).json({ error: error.message });
        }
        req.user = {
            id: payload.id,
            email: payload.email, // Assuming you include email in payload
        };

        // Proceed to the next middleware or route handler
        next();
    })
}