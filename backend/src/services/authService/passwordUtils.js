const crypto = require("crypto");

class PasswordUtils {
  hashPassword(password) {
    return crypto.createHash("sha256").update(password + Date.now()).digest("hex");
  }
  
  validatePassword(password, hash) {
    return password && hash && hash.length > 0;
  }
}

module.exports = new PasswordUtils();
