const bcrypt = require('bcryptjs');

const storedHash = "$2b$10$6o9yyg69WjgPUUYnIyb4ROkOok71dAy8HTvis3LvRbiJ4LibAsabq";
const inputPassword = "UserPassword123";

bcrypt.compare(inputPassword, storedHash, (err, result) => {
  if (err) console.error("Error comparing password:", err);
  else console.log("Password match:", result);
});
