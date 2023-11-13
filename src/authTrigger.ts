import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import notificationTemplate from "./adaptiveCards/notification-default.json";
import { CardData } from "./cardModels";
import { notificationApp } from "./internal/initialize";

const RTZEN_LOGIN_URL = "http://localhost:3000/login";
const AUTH_CALLBACK_URL =
  "http://localhost:3978/api/authTrigger?action=callback";

const authTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (req.query.action === "auth") {
    // Redirect to the authentication endpoint on your website
    context.res = {
      status: 302,
      headers: {
        Location: `${RTZEN_LOGIN_URL}?redirectUrl=${encodeURIComponent(
          AUTH_CALLBACK_URL
        )}`,
      },
      body: "",
    };
    return;
  }
  if (req.query.action === "callback") {
    // Handle the authentication callback from your website
    // Handle authentication callback
    const token = req.query.token; // Customize this based on your implementation

    // Validate the token and get user details
    const userDetails = await getUserDetails(token);

    if (userDetails) {
      // Store user details (customize this based on your storage solution)
      // storeUserDetails(userDetails);

      // Send authenticated message to Teams
      const teamsMessage = {
        type: "message",
        text: "Authenticated",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
              // Your adaptive card here
            },
          },
        ],
      };

      context.res = {
        status: 200,
        body: teamsMessage,
      };
    } else {
      // Handle authentication failure
      context.res = {
        status: 400,
        body: "Authentication failed",
      };
    }
  }

  // By default this function will iterate all the installation points and send an Adaptive Card
  // to every installation.
  if (req.query.userId) {
    const userId = req.query.userId;
    const userInfo = req.body; // Include user information in the request body

    // Store user information in your database or wherever appropriate
    // ...

    // Respond to the Teams activity with a message indicating successful authentication
    context.res = {
      status: 200,
      body: `Authentication successful for user ${userId}. You can now receive notifications.`,
    };
  } else {
    context.res = {
      status: 400,
      body: "Please provide a userId in the query parameters.",
    };
  }
  const pageSize = 100;
  let continuationToken: string | undefined = undefined;
  do {
    const pagedData = await notificationApp.notification.getPagedInstallations(
      pageSize,
      continuationToken
    );
    const installations = pagedData.data;
    continuationToken = pagedData.continuationToken;

    for (const target of installations) {
      await target.sendAdaptiveCard(
        AdaptiveCards.declare<CardData>(notificationTemplate).render({
          title: "New Event Occurred!",
          appName: "Contoso App Notification",
          description: `This is a sample http-triggered notification to ${target.type}`,
          notificationUrl: "https://aka.ms/teamsfx-notification-new",
        })
      );

      // Note - you can filter the installations if you don't want to send the event to every installation.

      /** For example, if the current target is a "Group" this means that the notification application is
       *  installed in a Group Chat.
      if (target.type === NotificationTargetType.Group) {
        // You can send the Adaptive Card to the Group Chat
        await target.sendAdaptiveCard(...);
  
        // Or you can list all members in the Group Chat and send the Adaptive Card to each Team member
        const pageSize = 100;
        let continuationToken: string | undefined = undefined;
        do {
          const pagedData = await target.getPagedMembers(pageSize, continuationToken);
          const members = pagedData.data;
          continuationToken = pagedData.continuationToken;

          for (const member of members) {
            // You can even filter the members and only send the Adaptive Card to members that fit a criteria
            await member.sendAdaptiveCard(...);
          }
        } while (continuationToken);
      }
      **/

      /** If the current target is "Channel" this means that the notification application is installed
       *  in a Team.
      if (target.type === NotificationTargetType.Channel) {
        // If you send an Adaptive Card to the Team (the target), it sends it to the `General` channel of the Team
        await target.sendAdaptiveCard(...);
  
        // Alternatively, you can list all channels in the Team and send the Adaptive Card to each channel
        const channels = await target.channels();
        for (const channel of channels) {
          await channel.sendAdaptiveCard(...);
        }
  
        // Or, you can list all members in the Team and send the Adaptive Card to each Team member
        const pageSize = 100;
        let continuationToken: string | undefined = undefined;
        do {
          const pagedData = await target.getPagedMembers(pageSize, continuationToken);
          const members = pagedData.data;
          continuationToken = pagedData.continuationToken;

          for (const member of members) {
            // You can even filter the members and only send the Adaptive Card to members that fit a criteria
            await member.sendAdaptiveCard(...);
          }
        } while (continuationToken);
      }
      **/

      /** If the current target is "Person" this means that the notification application is installed in a
       *  personal chat.
      if (target.type === NotificationTargetType.Person) {
        // Directly notify the individual person
        await target.sendAdaptiveCard(...);
      }
      **/
    }
  } while (continuationToken);

  context.res = {};
};

// Function to retrieve user details from the token (customize based on your implementation)
async function getUserDetails(token) {
  // Use your authentication provider's SDK or make HTTP request to validate and decode the token
  // For example, using axios and assuming the token contains user information
  try {
    // const response = await axios.get("YOUR_TOKEN_VALIDATION_ENDPOINT", {
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //   },
    // });

    // return response.data; // Adjust this based on your authentication provider's response structure
    return {};
  } catch (error) {
    console.error("Token validation failed", error);
    return null;
  }
}

// Function to store user details (customize based on your storage solution)
function storeUserDetails(userDetails) {
  // Implement logic to store user details in your preferred storage (e.g., Azure Storage, Database)
  // For example, you can use Azure Storage SDK:
  // const tableService = azure.createTableService(connectionString);
  // ...
}

export default authTrigger;
