const { BotFrameworkAdapter } = require('botbuilder');
const { TeamsAdapter } = require('botbuilder-teams');
const { SlackAdapter, SlackMessageTypeMiddleware } = require('botbuilder-adapter-slack');

// Replace these with your actual Slack and Teams credentials
const slackBotToken = 'YOUR_SLACK_BOT_TOKEN';
const teamsAppId = 'YOUR_TEAMS_APP_ID';
const teamsAppPassword = 'YOUR_TEAMS_APP_PASSWORD';

// Create the Teams adapter
const teamsAdapter = new TeamsAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
});

// Create the Slack adapter
const slackAdapter = new SlackAdapter({
    token: slackBotToken,
});

// Use SlackMessageTypeMiddleware to process Slack specific message types
slackAdapter.use(new SlackMessageTypeMiddleware());

// Set up the server
const server = require('restify').createServer();

// Handle incoming messages from Teams
teamsAdapter.onTurn(async (context) => {
    if (context.activity.type === 'message') {
        await context.sendActivity(`You said in Teams: ${context.activity.text}`);
    }
});

// Handle incoming messages from Slack
slackAdapter.onTurn(async (context) => {
    if (context.activity.type === 'message') {
        await context.sendActivity(`You said in Slack: ${context.activity.text}`);
    }
});

// Proactive messaging example for Teams
async function sendTeamsProactiveMessage(teamsUserId) {
    const conversationReference = await teamsAdapter.continueConversation(
        teamsAppId,
        teamsUserId,
        async (context) => {
            await context.sendActivity('Proactive message from Teams!');
        }
    );
}

// Proactive messaging example for Slack
async function sendSlackProactiveMessage(slackUserId) {
    const conversationReference = await slackAdapter.continueConversation(
        slackUserId,
        async (context) => {
            await context.sendActivity('Proactive message from Slack!');
        }
    );
}

// Set up the server to listen for incoming requests
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
});

// Use the adapters to process incoming requests
server.post('/api/messages/teams', (req, res) => {
    teamsAdapter.processActivity(req, res, async (context) => {
        await teamsAdapter.run(context);
    });
});

server.post('/api/messages/slack', (req, res) => {
    slackAdapter.processActivity(req, res, async (context) => {
        await slackAdapter.run(context);
    });
});

// Example of sending proactive messages
sendTeamsProactiveMessage('TEAMS_USER_ID'); // Replace with an actual Teams user ID
sendSlackProactiveMessage('SLACK_USER_ID'); // Replace with an actual Slack user ID
