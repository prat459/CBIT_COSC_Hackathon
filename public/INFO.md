# Pet Management Web App

A full-stack web application to manage pet data for registered users. Users can register, log in, add, edit, and view their pets, including photos and location data on a map.

---

## Features

- User registration and login with session management
- Password hashing for security
- User-specific dashboard displaying pets
- Add and edit pet details: species, breed, age, diseases, location, photo
- View pet locations on a map with markers
- Serve pet photos stored in PostgreSQL
- Logout functionality

---

## Technologies Used

- Node.js, Express.js
- PostgreSQL
- bcrypt for password hashing
- multer for file uploads
- express-session for session handling
- UUID for session IDs
- HTML, CSS, JavaScript for frontend

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
