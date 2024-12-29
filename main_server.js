const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const path = require("path");

const app = express();

// For parsing JSON bodies if needed
app.use(express.json());
// For reading/writing cookies
app.use(cookieParser());

// Hard-code the OAuth server info for Carleton
const OAUTH_SERVER_BASE = 'http://localhost:8000';
const CLIENT_ID = 'carleton-client-id';
const CLIENT_SECRET = 'carleton-client-secret';

// 1) Route: /toOauth?university=some_university
//    Always redirects user to Carleton's login page
app.get('/toOauth', (req, res) => {
    const { university } = req.query;
    // For simplicity we ignore `university` and always go to Carleton’s OAuth.

    // We need a callback URL that the OAuth server will redirect to with the code
    // This route is served by THIS dummy server:
    const callbackUrl = 'http://localhost:3000/callback?uni=Carleton%20University';

    // You can choose any state you want, or generate a random string
    const state = 'dummyState123';

    // Build the OAuth authorization URL
    // The OAuth dummy server expects:
    //   /auth/carleton?redirect_uri=...&state=...
    const carletonAuthUrl = `${OAUTH_SERVER_BASE}/auth/carleton?redirect_uri=${encodeURIComponent(
        callbackUrl
    )}&state=${encodeURIComponent(state)}`;

    // Redirect the user’s browser to Carleton’s OAuth login page
    return res.redirect(carletonAuthUrl);
});

// 2) Route: /callback
//    The OAuth server will redirect here with ?code=xxx&state=xxx&uni=Carleton%20University
//    We will exchange code for token, then use token to get user info.
app.get('/callback', async (req, res) => {
    const { code, uni, state } = req.query;

    // Basic check if code is present
    if (!code) {
        // Something went wrong, no code means we can't proceed
        return res.redirect('/error'); // Route that doesn't start with /user or /callback
    }

    // We must exchange this code for an access token by calling the OAuth server’s token endpoint
    try {
        // The redirect_uri in the token request must match what was used in the auth step
        const tokenRequestBody = {
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: 'http://localhost:3000/callback?uni=Carleton%20University', // Must match exactly
        };

        // Make a POST request to /auth/carleton/token
        const tokenResponse = await axios.post(
            `${OAUTH_SERVER_BASE}/auth/carleton/token`,
            tokenRequestBody
        );

        // On success, we receive { access_token, token_type, expires_in }
        const { access_token } = tokenResponse.data;
        if (!access_token) {
            // If we somehow didn't get an access token, treat it as an error
            return res.redirect('/error');
        }

        // Next, we fetch user info from the OAuth server, passing our Bearer token
        const userInfoResponse = await axios.get(
            `${OAUTH_SERVER_BASE}/auth/carleton/student-info`,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`, // The dummy server expects "Bearer access-token-..."
                },
            }
        );

        // If we got here, the login was "successful" according to the dummy logic
        // We set a cookie "logged=true" to signal success
        res.cookie('logged', 'true', { httpOnly: false });

        // Finally, redirect user to a route starting with /user
        return res.redirect('/user/welcome');
    } catch (error) {
        // If anything in the token exchange or user info fetch fails, we handle it here
        console.error('Error during OAuth callback process:', error.message);
        return res.redirect('/error');
    }
});

app.get('/json/universities.json', (req, res) => {
    const filePath = path.join(__dirname, 'json', 'universities.json');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error serving universities.json:', err);
            res.status(500).send('Error serving the file');
        }
    });
});

// Example success route for demonstration
app.get('/user/welcome', (req, res) => {
    res.send(
        `<h1>Welcome, user!</h1>
     <p>This means the login flow was successful, and we set 'logged=true'.</p>`
    );
});

// Example error route for demonstration
app.get('/error', (req, res) => {
    res.send(`
    <h1>Login Error</h1>
    <p>Something went wrong with the login process.</p>
  `);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Main dummy server running on http://localhost:${PORT}`);
});