const { BotFrameworkAdapter } = require('botbuilder');
const { TeamsAdapter, TeamsInfo } = require('botbuilder-teams');
const { SlackAdapter, SlackMessageTypeMiddleware } = require('botbuilder-adapter-slack');
const restify = require('restify');
const axios = require('axios');

const appId = process.env.MicrosoftAppId;
const appPassword = process.env.MicrosoftAppPassword;

const slackBotToken = 'YOUR_SLACK_BOT_TOKEN';
const slackClientId = 'YOUR_SLACK_CLIENT_ID';
const slackClientSecret = 'YOUR_SLACK_CLIENT_SECRET';

const teamsAppId = 'YOUR_TEAMS_APP_ID';
const teamsAppPassword = 'YOUR_TEAMS_APP_PASSWORD';

// In-memory storage for simplicity. In production, use a database.
const userStorage = {};

// Create the Teams adapter
const teamsAdapter = new TeamsAdapter({
    appId: appId,
    appPassword: appPassword,
});

// Create the Slack adapter
const slackAdapter = new SlackAdapter({
    token: slackBotToken,
    clientSigningSecret: slackClientSecret,
});

// Use SlackMessageTypeMiddleware to process Slack specific message types
slackAdapter.use(new SlackMessageTypeMiddleware());

// Set up the server
const server = restify.createServer();

// Slack OAuth Redirect URI
const slackRedirectUri = 'https://your-ngrok-url-or-production-url/slack/oauth';

// Teams OAuth Redirect URI
const teamsRedirectUri = 'https://your-ngrok-url-or-production-url/teams/oauth';

// OAuth state map for associating state with user IDs
const oauthStateMap = {};

// Teams OAuth middleware
server.get('/teams/oauth', async (req, res) => {
    const state = req.query.state;
    const userId = oauthStateMap[state];

    try {
        const tokenResponse = await TeamsInfo.getOAuthToken(req, { state });
        const user = await TeamsInfo.getUserInfo(req, tokenResponse.token);

        // Store the user ID in your service
        userStorage[userId] = { userId: user.id, userName: user.name };

        res.send(200, 'Authentication successful! You can close this window.');
    } catch (err) {
        console.error(err);
        res.send(500, 'Authentication failed.');
    }
});

// Slack OAuth middleware
server.get('/slack/oauth', async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;
    const userId = oauthStateMap[state];

    try {
        // Exchange the code for an access token
        const response = await axios.post(
            'https://slack.com/api/oauth.access',
            {
                client_id: slackClientId,
                client_secret: slackClientSecret,
                code: code,
                redirect_uri: slackRedirectUri,
            }
        );

        const accessToken = response.data.access_token;

        // Call the Slack API to get user information
        const userResponse = await axios.post(
            'https://slack.com/api/users.identity',
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const user = userResponse.data;

        // Store the user ID in your service
        userStorage[userId] = { userId: user.user.id, userName: user.user.name };

        res.send(200, 'Authentication successful! You can close this window.');
    } catch (err) {
        console.error(err);
        res.send(500, 'Authentication failed.');
    }
});

// Trigger proactive message to Teams
async function sendTeamsProactiveMessage(teamsUserId) {
    const conversationReference = await teamsAdapter.continueConversation(
        teamsAppId,
        teamsUserId,
        async (context) => {
            await context.sendActivity('Proactive message from Teams!');
        }
    );
}

// Trigger proactive message to Slack
async function sendSlackProactiveMessage(slackUserId) {
    const conversationReference = await slackAdapter.continueConversation(
        slackUserId,
        async (context) => {
            await context.sendActivity('Proactive message from Slack!');
        }
    );
}

// Example: Install app in Teams
server.get('/install/teams', (req, res) => {
    const userId = 'unique_user_id'; // Generate a unique user ID in your application

    // Save the user ID and associate it with a unique state
    const state = Math.random().toString(36).substring(7);
    oauthStateMap[state] = userId;

    const teamsInstallUrl = `https://teams.microsoft.com/l/app/${teamsAppId}?state=${state}&user=${userId}`;
    res.redirect(teamsInstallUrl);
});

// Example: Install app in Slack
server.get('/install/slack', (req, res) => {
    const userId = 'unique_user_id'; // Generate a unique user ID in your application

    // Save the user ID and associate it with a unique state
    const state = Math.random().toString(36).substring(7);
    oauthStateMap[state] = userId;

    const slackInstallUrl = `https://slack.com/oauth/v2/authorize?client_id=${slackClientId}&state=${state}&user=${userId}&redirect_uri=${slackRedirectUri}`;
    res.redirect(slackInstallUrl);
});

// Set up the server to listen for incoming requests
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
});
