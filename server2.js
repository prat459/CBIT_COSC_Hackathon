const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const pg = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL database configuration
const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'cosc',
    password: '1',
    port: 5432,
});

// Middleware
app.use(session({
    genid: (req) => {
        return uuidv4(); // Use UUIDs for session IDs
    },
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Multer setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Serve static files
app.use(express.static('public'));

// Routes

// Registration and login routes (implement user authentication)
app.get('/', (req, res) => {
    // Implement your login or registration page here
    res.sendFile(__dirname + '/public/homepage.html');
});

app.get('/loginpage', (req, res) => {
    // Implement your login or registration page here
    const { user } = req.session;
    if (user) {
        return res.redirect('/dashboard');
    }
    res.sendFile(__dirname + '/public/loginpage.html');
});

app.get('/sell', (req, res) => {
    const { user } = req.session;
    if (!user) {
        return res.redirect('/loginpage');
    }
    else {
        return res.redirect('/dashboard');
    }
});

app.post('/register', (req, res) => {
    const { username, password, name, contact, email } = req.body;
    pool.query('INSERT INTO users (username, password, name, contact, email) VALUES ($1, $2, $3, $4,$5)', [username, password, name, contact, email], (err, result) => {
        if (err) {
            res.status(500).json({ message: 'Error registering user' });
        } else {

            res.json({ message: 'User registered successfully' });

        }
    });
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password], (err, result) => {
        if (err || result.rows.length === 0) {
            res.status(401).json({ message: 'Authentication failed' });
        } else {
            // Store user information in the session
            req.session.user = result.rows[0];
            res.redirect('/dashboard');
        }
    });
});


// Dashboard route
// ... (Previous code)

// Modify the dashboard route to fetch user-specific pet data and render the dashboard
app.get('/dashboard', (req, res) => {
    const { user } = req.session;
    if (!user) {
        return res.redirect('/');
    }

    // Fetch user-specific pet data from the 'user_pet_data' table
    pool.query('SELECT * FROM user_pet_data WHERE user_id = $1', [user.id], (err, petDataResult) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching pet data' });
        }

        const petData = petDataResult.rows;

        // Render the dashboard HTML with user-specific data
        res.sendFile(__dirname + '/public/dashboard1.html', { user, petData });
    });
});

// Create a new route to fetch user-specific data as JSON
app.get('/dashboard-data', (req, res) => {
    const { user } = req.session;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fetch user-specific pet data including the photo as base64
    pool.query('SELECT id, species, breed, age, diseases, encode(photo, \'base64\') as photo, location FROM user_pet_data WHERE user_id = $1 order by id', [user.id], (err, petDataResult) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching pet data' });
        }

        const pets = petDataResult.rows;

        // Return user-specific pet data
        res.json({ user, pets });
    });
});

// ... (Rest of the code)


// Add pet route
app.get('/add-pet', (req, res) => {
    const { user } = req.session;
    if (!user) {
        return res.redirect('/');
    }

    // Render the add-pet HTML here (you can create an HTML file)
    res.sendFile(__dirname + '/public/add-pet.html');
});

app.post('/add-pet', upload.single('photo'), (req, res) => {
    const { user } = req.session;
    if (!user) {
        return res.redirect('/');
    }

    const { species, breed, age, diseases, location, markerLat, markerLng } = req.body;
    const photoBinary = req.file ? req.file.buffer : null;

    pool.query(
        'INSERT INTO user_pet_data (user_id, species, breed, age, diseases, photo, location, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [user.id, species, breed, age, diseases, photoBinary, location, markerLat, markerLng],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error adding pet data' });
            }

            res.redirect('/dashboard');
        }
    );
});

app.get('/edit-pet/:id', (req, res) => {
    const { user } = req.session;
    const { id } = req.params;

    if (!user) {
        return res.redirect('/');
    }

    // Fetch the pet data by ID
    pool.query('SELECT * FROM user_pet_data WHERE user_id = $1 AND id = $2', [user.id, id], (err, petDataResult) => {
        if (err || petDataResult.rows.length === 0) {
            return res.status(404).json({ message: 'Pet not found' });
        }

        const pet = petDataResult.rows[0];

        // Read the edit-pet.html file
        fs.readFile(__dirname + '/public/edit-pet.html', 'utf8', (err, data) => {
            if (err) {
                return res.status(500).json({ message: 'Error reading HTML file' });
            }

            // Replace placeholders with pet data
            const updatedHTML = data
                .replace('{{pet.id}}', pet.id)
                .replace('{{pet.species}}', pet.species)
                .replace('{{pet.breed}}', pet.breed)
                .replace('{{pet.age}}', pet.age)
                .replace('{{pet.diseases}}', pet.diseases || '')
                .replace('{{pet.location}}', pet.location);

            // Send the updated HTML as a response
            res.send(updatedHTML);
        });
    });
});

// Edit pet route (POST request to save changes)
app.post('/edit-pet/:id', (req, res) => {
    const { user } = req.session;
    const { id } = req.params;
    const { species, breed, age, diseases, location } = req.body;

    if (!user) {
        return res.redirect('/');
    }

    pool.query(
        'UPDATE user_pet_data SET species = $1, breed = $2, age = $3, diseases = $4, location = $5 WHERE user_id = $6 AND id = $7',
        [species, breed, age, diseases, location, user.id, id],
        (err, result) => {
            if (err) {
                console.error('Error editing pet data:', err);
                return res.status(500).json({ message: 'Error editing pet data.' });
            }

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Pet not found or not authorized.' });
            }

            // Pet data updated successfully
            res.redirect('/dashboard');
        }
    );
});



app.get('/image/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch the image data from the database based on the provided ID
        const query = {
            text: 'SELECT photo FROM user_pet_data WHERE id = $1',
            values: [id],
        };

        const result = await pool.query(query);

        if (result.rows.length > 0 && result.rows[0].image) {
            // Convert the binary data to base64
            const imageBuffer = result.rows[0].image;
            const base64Image = imageBuffer.toString('base64');

            // Set the response content type to image/jpeg (or the appropriate format)
            res.contentType('image/jpeg'); // Adjust based on your image format

            // Send the base64 encoded image as a response
            res.send(Buffer.from(base64Image, 'base64'));
        } else {
            console.log('Image not found for ID:', id);
            res.status(404).send('Image not found');
        }
    } catch (error) {
        console.error('Error fetching image:', error);
        res.status(500).send('An error occurred');
    }
});

app.get('/logout', (req, res) => {
    // Clear the session (destroy the session)
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        // Redirect to the login page or any other appropriate page
        res.redirect('/');
    });
});

app.post('/recommend', (req, res) => {
    const { age, affectionate, playful, allergies, livingSpace, energyLevel, outdoorSpace } = req.body;

    // Sample logic to recommend pets based on answers
    let recommendations = [];

    if (age <= 12) {
        recommendations.push('Rabbit');
    }

    if (affectionate === 'yes' && allergies === 'no') {
        recommendations.push('Cat', 'Dog');
    }

    if (playful === 'yes' && livingSpace === 'house') {
        recommendations.push('Dog');
    }

    if (outdoorSpace === 'yes' && energyLevel === 'high') {
        recommendations.push('Dog', 'Bird');
    }

    res.json({ recommendations });
});

app.get('/ques', (req, res) => {
    // Implement your login or registration page here
    res.sendFile(__dirname + '/public/recommend.html');
});


// Add a new route to render the markers page
// Add a new route to render the markers page
const getMarkers = async () => {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM user_pet_data');
        return result.rows;
    } finally {
        client.release();
    }
};

// Handle requests for marker data
// Function to convert bytea data to Base64
function byteaToBase64(byteaData) {
    if (!byteaData) {
        return ''; // Return an empty string if byteaData is null or undefined
    }
    return Buffer.from(byteaData, 'binary').toString('base64');
}

app.get('/markers', async (req, res) => {
    try {
        const client = await pool.connect();

        const { species, breed, age } = req.query;

        const query = `
            SELECT latitude, longitude, species, photo, breed, age
            FROM user_pet_data
            WHERE
                ($1 = '' OR species ILIKE $1)
                AND ($2 = '' OR breed ILIKE $2)
                AND ($3 = '' OR age::text ILIKE $3)
        `;

        const result = await client.query(query, [species, breed, age]);
        const markers = result.rows.map(row => {
            let iconUrl;
            if (row.species === 'dog') {
                iconUrl = 'https://emojiisland.com/cdn/shop/products/Dog_Emoji_large.png?v=1571606065'; // Customize with your dog icon URL
            } else if (row.species === 'cat') {
                iconUrl = 'https://cdn.shopify.com/s/files/1/1061/1924/files/CAT_emoji_icon_png.png?11238025486971989414'; // Customize with your cat icon URL
            } else {
                iconUrl = 'https://example.com/other-icon.png'; // Customize with a default icon URL
            }

            return {
                latitude: row.latitude,
                longitude: row.longitude,
                iconUrl: iconUrl, // Set the icon URL based on species
                breed: row.breed,
                age: row.age
            };
        });

        client.release();
        res.json(markers);
    } catch (error) {
        console.error('Error fetching markers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Serve the 'markers.html' file
app.get('/mark', (req, res) => {
    res.sendFile(__dirname + '/public/markers.html');
});

app.get('/seemap', (req, res) => {
    res.sendFile(__dirname + '/public/seemap.html');
});

app.get('/petData', (req, res) => {
    const query = 'SELECT user_id,latitude, longitude, photo, species, breed, age, diseases FROM user_pet_data';
    pool.query(query, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        } else {
            const petData = result.rows.map(row => ({
                user_id: row.user_id,
                latitude: row.latitude,
                longitude: row.longitude,
                photo: row.photo.toString('base64'), // Convert bytea to base64 for image URL
                species: row.species,
                breed: row.breed,
                age: row.age,
                diseases: row.diseases,
            }));
            res.json(petData);
        }
    });
});

app.get('/userDetails', async (req, res) => {
    try {
      const user_id = req.query.user_id;
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await client.query(query, [user_id]);
      const user = result.rows[0];
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/userDetailsPage', (req, res) => {
    // Handle the userDetailsPage route here
    // For example, you can send the userDetails.html file as a response
    res.sendFile(__dirname + '/public/userDetails.html');
  });

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
