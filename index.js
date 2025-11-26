const fs = require('fs');
const nodemailer = require('nodemailer');
const yahooFinance = require('yahoo-finance2').default;

// 1. Setup Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER
    }
});

async function checkDividends() {
    console.log("Starting Dividend Check...");

    // 2. Load Portfolio
    let portfolio;
    try {
        portfolio = JSON.parse(fs.readFileSync('portfolio.json', 'utf8'));
    } catch (e) {
        console.error("Error reading portfolio.json. Make sure the file exists.");
        process.exit(1);
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Date used for check: ${today}`);
    
    let messages = [];

    // 3. Loop through stocks
    for (const item of portfolio) {
        try {
            // Fetch financial data
            // We fetch 'summaryDetail' for dividend info and 'price' for current price
            const result = await yahooFinance.quoteSummary(item.ticker, { modules: ["summaryDetail", "price"] });
            const summary = result.summaryDetail;
            const price = result.price;

            if (!summary || !summary.exDividendDate) {
                console.log(`[${item.ticker}] No dividend data found or Ex-Date missing.`);
                continue;
            }

            // Convert API date to YYYY-MM-DD string
            const exDivDate = summary.exDividendDate.toISOString().split('T')[0];

            console.log(`[${item.ticker}] Ex-Date: ${exDivDate} | Today: ${today}`);

            // 4. Check if TODAY is the Ex-Dividend Date
            if (exDivDate === today) {
                const dividendRate = summary.dividendRate || 0;
                // If rate is missing, try to estimate from yield or use 0
                
                const totalPayout = (item.shares * dividendRate).toFixed(2);
                const currentPrice = price.regularMarketPrice;
                
                const message = `
                ---------------------------------------
                🔔 Stock: ${item.ticker}
                📅 Event: Ex-Dividend Date Today!
                💰 Dividend Per Share: $${dividendRate}
                📊 Your Shares: ${item.shares}
                💵 EST. PAYOUT: $${totalPayout}
                📈 Current Price: $${currentPrice}
                ---------------------------------------
                `;
                
                messages.push(message);
            } 

        } catch (error) {
            console.error(`Error checking ${item.ticker}:`, error.message);
        }
    }

    // 5. Send Email if matches found
    if (messages.length > 0) {
        console.log("Dividends found! Sending email...");
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER, // Sends to yourself
            subject: `💰 Dividend Alert: ${today}`,
            text: `You have incoming dividends today!\n\n${messages.join('\n')}`
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully!');
        } catch (error) {
            console.error('Error sending email:', error);
            process.exit(1); // Fail action if email fails
        }
    } else {
        console.log('No dividends found for today.');
    }
}

checkDividends();