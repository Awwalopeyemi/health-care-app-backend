// middleware/authenticateJWT.js
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.sendStatus(401);
    }
    
    const token = authHeader.split(' ')[1];  // Extract actual token
    
    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(419).json({ error: 'Token has expired' });
            }
            return res.sendStatus(403);
        }

        if (!user.id || !user.role) {
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
