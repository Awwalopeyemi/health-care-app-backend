// middleware/authenticateJWT.js
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // console.log("Received Authorization Header:", authHeader);
    
    if (!authHeader) {
        // console.log("Error: Token not provided in Authorization Header.");
        return res.sendStatus(401);
    }
    
    const token = authHeader.split(' ')[1];  // Extract actual token
    
    if (!token) {
        // console.log("Error: Bearer token missing in Authorization header.");
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // console.log("Token verification failed:", err);
            if (err.name === "TokenExpiredError") {
                return res.status(419).json({ error: 'Token has expired' });
            }
            return res.sendStatus(403);
        }

        // console.log("Token payload:", user);

        if (!user.id || !user.role) {
            // console.log("Error: Expected properties (id, role) missing in token payload.");
            return res.sendStatus(403);
        }

        req.user = {
            id: user.id,
            role: user.role
        };
        next();
    });
};

module.exports = authenticateJWT;
