// File: createUserProfile/src/index.js

import { Client, Databases, ID, Permission, Role } from 'node-appwrite';

// This is your Appwrite function
// It's executed each time a new user is created
export default async ({ req, res, log, error }) => {
  log("Function createUserProfile started execution.");

  // 1. Get the new user's data from the trigger payload
  let user;
  try {
    // Appwrite event data is in req.body
    user = JSON.parse(req.body);
    log(`Processing user: ${user.$id} (${user.email})`);
  } catch (e) {
    error("Could not parse user data from request body.");
    return res.json({ success: false, message: 'Invalid request body' }, 400);
  }

  // 2. Check for required environment variables from the Appwrite console
  if (
    !process.env.APPWRITE_DATABASE_ID ||
    !process.env.USERS_COLLECTION_ID ||
    !process.env.APPWRITE_API_KEY ||
    !process.env.APPWRITE_ENDPOINT ||
    !process.env.APPWRITE_PROJECT_ID
  ) {
    error("One or more environment variables are missing.");
    return res.json({ success: false, message: 'Function not configured' }, 500);
  }

  // 3. Initialize the Appwrite Node.js SDK
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  // 4. Prepare the user profile data for the database
  const userId = user.$id;
  
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 14);

  const userProfileData = {
    userId: userId,
    email: user.email,
    name: user.name,
    subscriptionStatus: 'trial',
    subscriptionEndDate: trialEndDate.toISOString(),
    plan: 'free',
    credits: 100,
  };

  log(`Prepared profile data for user ${userId}`);

  // 5. Create the document in the 'users' collection with specific permissions
  try {
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.USERS_COLLECTION_ID,
      ID.unique(),
      userProfileData,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    );
    log(`Successfully created profile for user ${userId}`);
    return res.json({ success: true, message: 'User profile created' });
  } catch (e) {
    error(`Failed to create document for user ${userId}: ${e.message}`);
    return res.json({ success: false, message: e.message }, 500);
  }
};