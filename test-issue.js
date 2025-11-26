const github = require('@actions/github');

async function createTestIssue() {
    console.log("Starting Test Issue Creation...");

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error("Error: GITHUB_TOKEN environment variable is missing.");
        process.exit(1);
    }

    const octokit = github.getOctokit(token);
    const context = github.context;

    const today = new Date().toISOString().split('T')[0];

    try {
        console.log("Attempting to create issue...");
        await octokit.rest.issues.create({
            ...context.repo,
            title: `🧪 Test Issue: Dividend Checker ${today}`,
            body: `This is a **TEST** issue created manually to verify that the Dividend Checker has permission to create issues.\n\nIf you see this, it works! 🎉`
        });
        console.log('Test GitHub Issue created successfully!');
    } catch (error) {
        console.error('Error creating GitHub Issue:', error);
        process.exit(1);
    }
}

createTestIssue();
