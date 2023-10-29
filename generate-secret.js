const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
console.log("Your new secret key is:", secret);
