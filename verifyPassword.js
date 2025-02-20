const bcrypt = require("bcryptjs");

const storedHashedPassword = "$2b$10$utpEg3csOipzXjhgMdE2ZeVcycw1FBIz4BkG2XpcQ/qb4WmGw0HKC";
const inputPassword = "AdminPassword123";

bcrypt.compare(inputPassword, storedHashedPassword).then((match) => {
  console.log(match ? "Password matches!" : "Password mismatch!");
});
