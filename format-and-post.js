const fs = require('fs');
const { Octokit } = require('@octokit/rest');

const { formatForGitHub, REVIEW_MARKER } = require('./formatter');

/**
 * Extract version from existing comment body
 */
function extractVersion(body) {
  // Match version in metadata block (multi-line format)
  const versionMatch = body.match(/<!-- open-review:meta\nversion:\s*(\d+)/);
  return versionMatch ? parseInt(versionMatch[1], 10) : 0;
}


async function main() {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const [owner, repo] = process.env.REPO.split('/');
  const prNumber = parseInt(process.env.PR_NUMBER, 10);

  // Read the ReviewResult from core CLI
  const result = JSON.parse(fs.readFileSync(process.env.RESULT_FILE, 'utf8'));

  // Find existing Open Review comment or create new one
  const existingComment = await findExistingReviewComment(octokit, owner, repo, prNumber);

  // Determine version
  const currentVersion = existingComment ? extractVersion(existingComment.body) : 0;
  const newVersion = currentVersion + 1;

  // Format for GitHub
  const comment = formatForGitHub(result, newVersion);

  if (existingComment) {
    // Update existing comment
    await octokit.issues.updateComment({
      owner,
      repo,
      comment_id: existingComment.id,
      body: comment
    });
    console.log(`Review updated successfully (version ${newVersion})`);
  } else {
    // Create new comment
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: comment
    });
    console.log(`Review posted successfully (version ${newVersion})`);
  }
}

/**
 * Find an existing Open Review comment on the PR
 * Looks for comments from github-actions that contain our marker
 */
async function findExistingReviewComment(octokit, owner, repo, prNumber) {
  try {
    const { data: comments } = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
      per_page: 100
    });

    // Find the most recent comment from github-actions with our marker
    // Note: GitHub Actions bot can be 'github-actions' or 'github-actions[bot]'
    const openReviewComments = comments
      .filter(c =>
        (c.user?.login === 'github-actions' || c.user?.login === 'github-actions[bot]') &&
        c.body?.includes(REVIEW_MARKER)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return openReviewComments[0] || null;
  } catch (error) {
    console.warn('Could not fetch existing comments:', error.message);
    return null;
  }
}


main().catch(err => {
  console.error('Failed to post review:', err);
  process.exit(1);
});
