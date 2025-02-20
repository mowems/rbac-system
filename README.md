# Ekko Challenge - Role-Based Access Control (RBAC) API

This project is a full stack Role Based Access Control (RBAC) API built with **Node.js, Express, Prisma, and PostgreSQL**. It allows users to be assigned roles and permissions dynamically, ensuring secure access control.

---

## ** Features**

- User authentication with JWT (Login, Register, Logout)
- Role-Based Access Control (RBAC)
- CRUD operations on users, roles, and permissions
- Prisma ORM with PostgreSQL database
- Docker support for database containerization
- Comprehensive API tests using Jest & Supertest
- Seed database with predefined roles and permissions

---

## **Tech Stack**

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL, Prisma ORM
- **Authentication:** JWT (JSON Web Token)
- **Testing:** Jest, Supertest
- **Containerization:** Docker
- **Version Control:** Git, GitHub

---

## **Getting Started**

Install Dependencies

- npm install

Set up environment variables

- DATABASE_URL="postgresql://user:password@localhost:5434/ekkochalldb"
- JWT_SECRET="your_secret_key"

Run PostgreSQL in Docker - Ensure you have Docker installed

- docker-compose up -d

Apply database migrations

- npx prisma migrate dev --name init

Seed the database

- npm run seed

Start the API

- npm run dev

Authentication
Method Endpoint Description
POST /api/auth/register Register a new user
POST /api/auth/login Login and get JWT token
POST /api/auth/logout Logout user

Users
Method Endpoint Description
GET /api/users Get all users
GET /api/users/:id Get user by ID
POST /api/users Create a new user (Admin only)
PATCH /api/users/:id Update user details (Admin only)
DELETE /api/users/:id Delete a user (Admin only)

Roles & Permissions
Method Endpoint Description
GET /api/roles Get all roles
POST /api/roles Create a new role (Admin only)
POST /api/assignments/users/:userId/assign-role Assign a role to a user

Testing

- npm test

### **Clone the repository**

```sh
git clone https://github.com/mowems/ekko-challenge-davidu.git
cd ekko-challenge
```

### NOTES \*\*

Ensure Docker is installed and running before setting up the database.
Modify the .env file with your own database credentials before running migrations.
Only admins can create users and assign roles.
The API is fully tested with Jest & Supertest.
