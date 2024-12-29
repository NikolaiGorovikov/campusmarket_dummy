const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// In-memory store for user accounts and OAuth tokens
const users = [
    // 10 students
    { username: "student1", name: "Student One", email: "student1@cmail.carleton.ca", role: "Student", role_display: "Student" },
    { username: "student2", name: "Student Two", email: "student2@cmail.carleton.ca", role: "Student", role_display: "Student" },
    { username: "student3", name: "Student Three", email: "student3@cmail.carleton.ca", role: "Student", role_display: "Student" },
    { username: "student4", name: "Student Four", email: "student4@cmail.carleton.ca", role: "Student", role_display: "Student" },
    { username: "student5", name: "Student Five", email: "student5@cmail.carleton.ca", role: "Student", role_display: "Student" },
    { username: "student6", name: "Student Six", email: "student6@cmail.carleton.ca", role: "Student", role_display: "Student" },
    { username: "student7", name: "Student Seven", email: "student7@cmail.carleton.ca", role: "Student", role_display: "Student" },
    { username: "student8", name: "Student Eight", email: "student8@cmail.carleton.ca", role: "Student", role_display: "Student" },
    { username: "student9", name: "Student Nine", email: "student9@cmail.carleton.ca", role: "Student", role_display: "Student" },
    { username: "student10", name: "Student Ten", email: "student10@cmail.carleton.ca", role: "Student", role_display: "Student" },

    // 10 staff members
    { username: "staff1", name: "Staff One", email: "staff1@carleton.ca", role: "Staff", role_display: "Administrator" },
    { username: "staff2", name: "Staff Two", email: "staff2@carleton.ca", role: "Staff", role_display: "IT Support" },
    { username: "staff3", name: "Staff Three", email: "staff3@carleton.ca", role: "Staff", role_display: "Librarian" },
    { username: "staff4", name: "Staff Four", email: "staff4@carleton.ca", role: "Staff", role_display: "Technician" },
    { username: "staff5", name: "Staff Five", email: "staff5@carleton.ca", role: "Staff", role_display: "HR Specialist" },
    { username: "staff6", name: "Staff Six", email: "staff6@carleton.ca", role: "Staff", role_display: "Counselor" },
    { username: "staff7", name: "Staff Seven", email: "staff7@carleton.ca", role: "Staff", role_display: "Coordinator" },
    { username: "staff8", name: "Staff Eight", email: "staff8@carleton.ca", role: "Staff", role_display: "Accountant" },
    { username: "staff9", name: "Staff Nine", email: "staff9@carleton.ca", role: "Staff", role_display: "Registrar" },
    { username: "staff10", name: "Staff Ten", email: "staff10@carleton.ca", role: "Staff", role_display: "Research Assistant" }
];

// In-memory mapping of authorization codes to users
const authCodeToUserMap = {};

let accessToken = null;

// OAuth Configuration (to be used by your main app)
const clientID = 'carleton-client-id';
const clientSecret = 'carleton-client-secret';
const redirectURI = 'https://localhost:3000/auth/carleton/callback'; // The redirect URI for your main app

// Route: Authorization Endpoint (Simulates OAuth Authorization Page)
app.get('/auth/carleton', (req, res) => {
    res.send(`
        <h1>Carleton University Login</h1>
        <form action="/auth/carleton/login?redirect_uri=${req.query.redirect_uri}&state=${req.query.state}" method="POST">
            <input type="text" name="username" placeholder="Username" required />
            <input type="password" name="password" placeholder="Password" required />
            <button type="submit">Login</button>
        </form>
    `);
});

// Route: Handle login and generate authorization code
app.post('/auth/carleton/login', (req, res) => {
    const username = req.body.username;
    const user = users.find(user => user.username === username);

    // If user exists, generate an authorization code and map it to the user
    if (user) {
        const authCode = `auth-code-${username}`; // Generate code dynamically based on username
        authCodeToUserMap[authCode] = user; // Map the authorization code to the user
        const redirectUriWithCode = `${req.query.redirect_uri}&code=${authCode}&state=${req.query.state}`;
        res.redirect(redirectUriWithCode);
    } else {
        // If user doesn't exist, use "Random" user logic
        const authCode = 'auth-code-random';
        authCodeToUserMap[authCode] = {
            student_id: "000000000",
            name: "Random",
            email: "random@cmail.carleton.ca",
            role: "Guest",
            role_display: "Guest"
        };
        const redirectUriWithCode = `${req.query.redirect_uri}&code=${authCode}&state=${req.query.state}`;
        res.redirect(redirectUriWithCode);
    }
});

// Route: Token Endpoint (Exchanges authorization code for an access token)
app.post('/auth/carleton/token', (req, res) => {
    const { code, client_id, client_secret, redirect_uri } = req.body;

    // Validate the code, client_id, and client_secret
    if (authCodeToUserMap[code] && client_id === clientID && client_secret === clientSecret) {
        // Generate a mock access token
        accessToken = `access-token-${code}`; // Access token is unique to the auth code
        res.json({
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: 3600 // 1 hour
        });
    } else {
        res.status(400).json({ error: 'Invalid request parameters' });
    }
});

// Route: Simulate a protected resource (Fetching user info)
app.get('/auth/carleton/student-info', (req, res) => {
    const token = req.headers.authorization;

    // Extract the auth code from the token
    const authCode = token && token.replace('Bearer access-token-', '');

    // Check if the token matches any user
    if (authCode && authCodeToUserMap[authCode]) {
        res.json(authCodeToUserMap[authCode]);
    } else {
        res.status(401).json({ error: 'Invalid access token' });
    }
});

// Start the authentication server on port 8000
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Carleton University OAuth simulation server running on port ${PORT}`);
});