const fs = require('fs');
const yahooFinance = require('yahoo-finance2').default;
const core = require('@actions/core');
const github = require('@actions/github');

async function checkDividends() {
    console.log("Starting Dividend Check...");

    // 1. Load Portfolio
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

    // 2. Loop through stocks
    for (const item of portfolio) {
        try {
            const result = await yahooFinance.quoteSummary(item.ticker, { modules: ["summaryDetail", "price"] });
            const summary = result.summaryDetail;
            const price = result.price;

            if (!summary || !summary.exDividendDate) {
                console.log(`[${item.ticker}] No dividend data found or Ex-Date missing.`);
                continue;
            }

            const exDivDate = summary.exDividendDate.toISOString().split('T')[0];
            console.log(`[${item.ticker}] Ex-Date: ${exDivDate} | Today: ${today}`);

            // 3. Check if TODAY is the Ex-Dividend Date
            if (exDivDate === today) {
                const dividendRate = summary.dividendRate || 0;
                const totalPayout = (item.shares * dividendRate).toFixed(2);
                const currentPrice = price.regularMarketPrice;
                
                const message = `
### 🔔 Stock: ${item.ticker}
- **Event**: Ex-Dividend Date Today!
- **Dividend Per Share**: $${dividendRate}
- **Your Shares**: ${item.shares}
- **EST. PAYOUT**: $${totalPayout}
- **Current Price**: $${currentPrice}
`;
                messages.push(message);
            } 

        } catch (error) {
            console.error(`Error checking ${item.ticker}:`, error.message);
        }
    }

    // 4. Create GitHub Issue if matches found
    if (messages.length > 0) {
        console.log("Dividends found! Creating GitHub Issue...");
        
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            console.error("No GITHUB_TOKEN found. Cannot create issue.");
            // Don't fail the build, just log error, or maybe fail if critical?
            // Let's fail so user knows notification didn't go out.
            process.exit(1);
        }

        const octokit = github.getOctokit(token);
        const context = github.context;

        try {
            await octokit.rest.issues.create({
                ...context.repo,
                title: `💰 Dividend Alert: ${today}`,
                body: `You have incoming dividends today!\n\n${messages.join('\n---\n')}`
            });
            console.log('GitHub Issue created successfully!');
        } catch (error) {
            console.error('Error creating GitHub Issue:', error);
            process.exit(1);
        }
    } else {
        console.log('No dividends found for today.');
    }
}

checkDividends();