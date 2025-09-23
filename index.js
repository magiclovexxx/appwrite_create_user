import { Client, Databases, ID, Permission, Role } from 'node-appwrite';

// This is your Appwrite function
// It's executed each time a user is created
export default async ({ req, res, log, error }) => {
  log('User creation function triggered...');

  // Appwrite passes event data in an environment variable.
let eventData;
try {
  eventData = JSON.parse(process.env.APPWRITE_FUNCTION_EVENT_DATA);
} catch {
  eventData = { message: "Test run, no event data" };
}
console.log(eventData);
  try {
    const user = JSON.parse(eventData);
    log(`Processing user: ${user.name} (ID: ${user.$id})`);

    // Initialize the Appwrite client
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const usersCollectionId = 'users'; // Make sure this matches your collection ID

    // Create the user profile document
    await databases.createDocument(
      databaseId,
      usersCollectionId,
      ID.unique(), // Use a new unique ID for the document
      {
        userId: user.$id, // Link to the auth user
        email: user.email,
        name: user.name,
        subscriptionStatus: 'trial', // Default value
        plan: 'free',                 // Default value
        credits: 10,                  // Default value for new users
      },
      [
        Permission.read(Role.user(user.$id)),
        Permission.update(Role.user(user.$id)),
        Permission.delete(Role.user(user.$id)),
      ]
    );

    log(`Successfully created profile for user: ${user.$id}`);
    return res.json({ success: true, message: "User profile created successfully." });

  } catch (e) {
    error('Error creating user profile:', e);
    return res.json({ success: false, error: e.message }, 500);
  }
};