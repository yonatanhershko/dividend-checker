const nodemailer = require('nodemailer');

// 1. Setup Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER
    }
});

async function sendTestEmail() {
    console.log("Sending Test Email...");
    console.log(`User: ${process.env.GMAIL_USER}`);

    if (!process.env.GMAIL_USER) {
        console.error("Error: GMAIL_USER environment variable is missing.");
        process.exit(1);
    }

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER, // Sends to yourself
        subject: `Test Email from Dividend Checker`,
        text: `This is a test email to verify that your GitHub Secrets and Nodemailer configuration are working correctly.\n\nTime: ${new Date().toISOString()}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('Error sending test email:', error);
        process.exit(1);
    }
}

sendTestEmail();
