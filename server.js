const express = require('express');
const axios = require('axios');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

app.use(express.static('public'));

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://github-authentication.onrender.com/callback';

app.use((req, res, next) => {
    if (req.session.githubAccessToken) {
        req.user = req.session.githubUser;
    }
    next();
});

app.get('/login/github', (req, res) => {
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user`);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;

    const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: 'client_id',
        client_secret: 'client_secret',
        code: code,
        redirect_uri: 'https://github-authentication.onrender.com/callback',
    }, {
        headers: {
            'Accept': 'application/json',
        },
    });

    const accessToken = response.data.access_token;

    const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    const user = userResponse.data;

    req.session.githubAccessToken = accessToken;
    req.session.githubUser = user;

    res.redirect('/');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/user', (req, res) => {
    res.json(req.session.githubUser || null);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
