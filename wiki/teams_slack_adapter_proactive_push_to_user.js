const { BotFrameworkAdapter } = require('botbuilder');
const { TeamsAdapter, TeamsInfo } = require('botbuilder-teams');
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
    // Send an Adaptive Card in Teams
    const card = createTeamsAdaptiveCard();
    await context.sendActivity({ attachments: [card] });
  }
});

// Handle incoming messages from Slack
slackAdapter.onTurn(async (context) => {
  if (context.activity.type === 'message') {
    // Send an Adaptive Card in Slack
    const card = createSlackAdaptiveCard();
    await context.sendActivity({ attachments: [card] });
  }
});

// Proactive messaging example for Teams
async function sendTeamsProactiveMessage(teamsUserId) {
  const conversationReference = await teamsAdapter.continueConversation(
    teamsAppId,
    teamsUserId,
    async (context) => {
      // Send an Adaptive Card in Teams
      const card = createTeamsAdaptiveCard();
      await context.sendActivity({ attachments: [card] });
    }
  );
}

// Proactive messaging example for Slack
async function sendSlackProactiveMessage(slackUserId) {
  const conversationReference = await slackAdapter.continueConversation(
    slackUserId,
    async (context) => {
      // Send an Adaptive Card in Slack
      const card = createSlackAdaptiveCard();
      await context.sendActivity({ attachments: [card] });
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

// Function to create an Adaptive Card for Teams
function createTeamsAdaptiveCard() {
  return {
    contentType: 'application/vnd.microsoft.card.adaptive',
    content: {
      type: 'AdaptiveCard',
      body: [
        {
          type: 'TextBlock',
          text: 'Hello, this is an Adaptive Card in Teams!',
          size: 'large',
        },
      ],
      actions: [
        {
          type: 'Action.OpenUrl',
          title: 'Learn More',
          url: 'https://adaptivecards.io/',
        },
      ],
    },
  };
}

// Function to create an Adaptive Card for Slack
function createSlackAdaptiveCard() {
  return {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: 'Adaptive Card in Slack',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Hello, this is an Adaptive Card in Slack!*',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'You can customize this card for Slack features.',
        },
      },
    ],
  };
}
