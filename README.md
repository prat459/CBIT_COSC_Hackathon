# CBIT COSC Hacktoberfest Hackathon: Team-31
# PETDOPT - Pet Adoption Website

A full-stack web application to manage pet data for registered users. Users can register, log in, add, edit, and view their pets, including photos and location data on a map.

## Features

- User registration and login with session management
- Password hashing for security
- User-specific dashboard displaying pets
- Add and edit pet details: species, breed, age, diseases, location, photo
- View pet locations on a map with pet emoji markers
   
## Technologies Used
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Session Handling**: UUID, express-session
- **File Uploading:** multer
- **Password Hashing:** bcrypt

---

## Getting Started
### Prerequisites

- Node.js and npm installed
- PostgreSQL installed and running

### Database Setup

Create a database named `cosc` (or your choice) and create the following tables:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  contact VARCHAR(15),
  email VARCHAR(100)
);

```

```sql
CREATE TABLE user_pet_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  species VARCHAR(50),
  breed VARCHAR(50),
  age INTEGER,
  diseases TEXT,
  photo BYTEA,
  location VARCHAR(255),
  latitude FLOAT,
  longitude FLOAT
);
```

---

## Installation
- Clone the repo or copy files.
- Install dependencies: npm install express express-session body-parser multer pg bcrypt uuid
- Configure database connection in server2.js:
```sql
const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cosc',
  password: 'your_password',
  port: 5432,
});
```
- Start the server: ``` node server2.js ```

---

## Project Structure
```
/images 
/node_modules
/public
  ├── homepage.html
  ├── loginpage.html
  ├── dashboard1.html
  ├── add-pet.html
  ├── edit-pet.html
  ├── userDetails.html
  ├── seemap.html
server2.js
package-lock.json
package.json
README.md
```

---

## API Routes

| Method | Route              | Description                         |
| ------ | ------------------ | ----------------------------------- |
| GET    | `/`                | Homepage / Login page               |
| GET    | `/loginpage`       | Login page                          |
| POST   | `/register`        | Register new user                   |
| POST   | `/login`           | User login                          |
| GET    | `/dashboard`       | User dashboard                      |
| GET    | `/dashboard-data`  | JSON of logged-in user’s pets       |
| GET    | `/add-pet`         | Add pet page                        |
| POST   | `/add-pet`         | Submit new pet data                 |
| GET    | `/edit-pet/:id`    | Edit pet page                       |
| POST   | `/edit-pet/:id`    | Submit pet edits                    |
| GET    | `/image/:id`       | Serve pet photo                     |
| GET    | `/logout`          | Logout user                         |
| GET    | `/seemap`          | Map page showing pet markers        |
| GET    | `/petData`         | JSON data for all pets (for map)    |
| GET    | `/userDetails`     | Get user details by user\_id (JSON) |
| GET    | `/userDetailsPage` | Serve user details HTML page        |

 ---

## Notes 
- Passwords should be hashed before storing. (bcrypt recommended)
- Images are stored as binary (BYTEA) in the database.
- Sessions use UUIDs for secure session IDs.
- For production, secure environment variables and HTTPS should be used.

---
