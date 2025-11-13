BROWAYESU-MDS WhatsApp Bot

This is a multi-purpose WhatsApp bot built with Node.js and @whiskeysockets/baileys. It’s designed to be easy to set up and deploy on various hosting platforms.

✨ Features

Simple Menu: A .menu command that displays all available commands.

Media Support: Sends images and audio files as part of the menu command.

Easy Authentication: Uses QR code scanning to generate a session ID for deployment.

Deployable: Designed to be deployed on services like Heroku, Koyeb, Railway, etc.


🚀 Setup and Installation

Follow these steps to get the bot running on your local machine.

1. Clone the Repository

git clone https://github.com/BroWaYesu/BROWAYESU-MDS.git
cd BROWAYESU-MDS

2. Install Dependencies

You need to have Node.js (v18 or higher) installed.

npm install

3. Generate Session ID

To run the bot, you need a session ID that links it to your WhatsApp account.

1. Run the session generation script:

node generate-session.js


2. A QR code will appear in your terminal. Scan this QR code with your phone by going to WhatsApp > Settings > Linked Devices > Link a Device.


3. Once you scan it, the script will print a long string of text (your Session ID). Copy this entire string and save it somewhere safe.



> Warning: Treat your Session ID like a password. Anyone with this ID can access your WhatsApp account.



4. Run the Bot

After getting your session ID, you can run the main bot. For local testing, the bot will use the auth_info_baileys folder created in the previous step.

node index.js

Your bot is now running! Send .menu to its private messages to test it.

☁️ Deployment

To deploy this bot to a server (like Heroku, Koyeb, etc.), you need to use the Session ID you generated in Step 3.

1. On your hosting platform, create a new application.


2. Set an environment variable (sometimes called a "secret" or "config var").

Variable Name: SESSION_ID

Variable Value: Paste the long session ID string you copied earlier.



3. The index.js file will need to be modified to read this environment variable. (This functionality can be added later.)


4. Deploy your application. The bot will use the SESSION_ID to log in instead of asking for a QR code.


