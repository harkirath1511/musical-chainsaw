import { google } from 'googleapis';
import readline from 'readline';
import dotenv from 'dotenv'

dotenv.config();

// 1. Copy these from your credentials.json (the Web Client one)
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URL; // Must match Google Cloud Console

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // CRITICAL: This gives you the Refresh Token
  scope: SCOPES,
});

console.log('Authorize this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', async (code) => {
  rl.close();
  const { tokens } = await oauth2Client.getToken(code);
  console.log('Successfully authorized! Your Refresh Token is:');
  console.log(tokens.refresh_token);
  console.log('\nSave this Refresh Token safely in your .env file.');
});
