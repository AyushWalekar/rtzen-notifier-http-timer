import {
  CardFactory,
  TeamsActivityHandler,
  MessageFactory,
  TurnContext,
} from "botbuilder";

// An empty teams activity handler.
// You can add your customization code here to extend your bot logic if needed.
export class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();
  }
  async onMessageActivity(context: TurnContext): Promise<void> {
    const cardJson = {
      type: "AdaptiveCard",
      body: [
        {
          type: "TextBlock",
          text: "Please sign in to access your notifications.",
        },
      ],
      actions: [
        {
          type: "Action.OpenUrl",
          title: "Sign In",
          url: `http://localhost:3978/aoi/auth?action=auth&userId=${context.activity.from.id}`,
        },
        {
          type: "Action.Submit",
          title: "Authenticate",
          data: {
            type: "auth",
          },
        },
      ],
    };
    const cardAttachment = CardFactory.adaptiveCard(cardJson);

    const message = MessageFactory.attachment(cardAttachment);

    await context.sendActivity(message);
  }
}
