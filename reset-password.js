const bcrypt = require('bcryptjs');

const newPassword = "testpassword";
const saltRounds = 10;

bcrypt.hash(newPassword, saltRounds, (err, hashedPassword) => {
  if (err) console.error("Error hashing password:", err);
  else console.log("New Hashed Password:", hashedPassword);
});
