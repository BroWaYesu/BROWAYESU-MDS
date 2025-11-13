const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const qrcode = require('qrcode-terminal');

async function generateSession() {
    // Load or create authentication state
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    // Fetch latest WhatsApp Web version for compatibility
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using WhatsApp Web v${version.join('.')}, Latest: ${isLatest}`);

    // Create WhatsApp connection
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false, // We'll handle QR manually
    });

    // Save updated credentials whenever they change
    sock.ev.on('creds.update', saveCreds);

    // Handle connection and QR generation
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Display QR code in terminal for scanning
        if (qr) {
            console.log('📱 Scan this QR code with your WhatsApp app:');
            qrcode.generate(qr, { small: true });
        }

        // Once connected successfully
        if (connection === 'open') {
            console.log('✅ Connection established. Generating session file...');

            // Wait a few seconds to ensure all credentials are saved
            setTimeout(() => {
                try {
                    const credsPath = 'auth_info_baileys/creds.json';
                    if (!fs.existsSync(credsPath)) {
                        throw new Error('Credentials file not found. Try reconnecting.');
                    }

                    // Read the credentials and encode them to base64
                    const creds = JSON.parse(fs.readFileSync(credsPath));
                    const base64Creds = Buffer.from(JSON.stringify(creds)).toString('base64');

                    console.log('\n====================================');
                    console.log('            SESSION ID              ');
                    console.log('====================================\n');
                    console.log(base64Creds);
                    console.log('\n====================================');
                    console.log('✅ Copy the SESSION ID above and save it securely.');
                    console.log('You’ll use it later as an environment variable (SESSION_ID).');
                    console.log('====================================\n');

                    // Gracefully close the process
                    process.exit(0);
                } catch (err) {
                    console.error('❌ Failed to generate session file:', err);
                    process.exit(1);
                }
            }, 5000); // 5 seconds to ensure all files are written
        }

        // Handle connection close or reconnection
        if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect?.error?.output?.statusCode) !== DisconnectReason.loggedOut;
            console.log('⚠️ Connection closed due to', lastDisconnect?.error, ', Reconnecting:', shouldReconnect);
            if (shouldReconnect) generateSession();
        }
    });
}

// Run the generator
generateSession();
