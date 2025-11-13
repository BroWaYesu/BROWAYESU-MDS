const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');

async function connectToWhatsApp() {
    // Load or create authentication state
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    // Fetch the latest version of WhatsApp Web
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WhatsApp Web v${version.join('.')}, Latest: ${isLatest}`);

    // Create the socket connection
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // disable QR printing in terminal
        auth: state,
    });

    // Handle pairing (first-time setup)
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            const phoneNumber = process.env.PAIRING_CODE_PHONE_NUMBER || '';
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(`Your WhatsApp pairing code: ${code}`);
            console.log(
                'Go to WhatsApp > Linked Devices > Link with phone number and enter this code.'
            );
        }, 3000);
    }

    // Handle connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect?.error?.output?.statusCode) !== DisconnectReason.loggedOut;
            console.log(
                'Connection closed due to ',
                lastDisconnect?.error,
                ', Reconnecting: ',
                shouldReconnect
            );
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ WhatsApp connection opened successfully!');
        }
    });

    // Save credentials whenever updated
    sock.ev.on('creds.update', saveCreds);

    // Message event listener
    sock.ev.on('messages.upsert', async (m) => {
        for (const message of m.messages) {
            if (!message.message) continue;

            const messageText =
                message.message.conversation ||
                message.message.extendedTextMessage?.text;
            const remoteJid = message.key.remoteJid;

            if (!messageText) continue;

            if (messageText.toLowerCase() === '.menu') {
                console.log(`Received .menu command from ${remoteJid}`);

                const menuText = `
Hello! 👋 I'm your friendly story bot.
Here are the available commands:
- *.menu*: Show this menu
- *.story*: Start reading a story
- *.next*: Get the next part of the story
`;

                // Send image with menu caption
                await sock.sendMessage(remoteJid, {
                    image: { url: './menu_image.jpg' },
                    caption: menuText,
                });

                // Send optional audio clip
                await sock.sendMessage(remoteJid, {
                    audio: { url: './menu_audio.mp3' },
                    mimetype: 'audio/mp4',
                });
            } else {
                console.log(`Received message: "${messageText}" from ${remoteJid}`);
                // Example reply:
                // await sock.sendMessage(remoteJid, { text: 'Hello there!' });
            }
        }
    });
}

// Start the bot
connectToWhatsApp();
