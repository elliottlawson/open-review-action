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

/**
 * Overlay action presentation inputs onto the review result.
 *
 * The old CLI merged these into the JSON output itself; the opencode engine
 * only emits review content, so the action injects them here before
 * formatting. Defaults match the old CLI's config schema so the rendered
 * comment is unchanged: sections enabled with collapse=auto, verdict labels
 * LGTM / Changes Needed / Hold, timezone America/New_York.
 */
function applyPresentationInputs(result) {
  const env = process.env;

  const sectionKeys = ['must_fix', 'should_fix', 'suggestions', 'questions'];
  result.sections = result.sections || {};
  for (const key of sectionKeys) {
    const suffix = key.toUpperCase();
    const enabledInput = env[`INPUT_${suffix}`];
    const collapseInput = env[`INPUT_COLLAPSE_${suffix}`];
    const existing = result.sections[key] || {};
    // Precedence: action input > engine value > old CLI default.
    result.sections[key] = {
      enabled: enabledInput ? enabledInput === 'true' : (existing.enabled !== undefined ? existing.enabled : true),
      collapse: collapseInput || existing.collapse || 'auto',
    };
  }

  const verdictDefaults = {
    approve: 'LGTM',
    changes_needed: 'Changes Needed',
    hold: 'Hold',
  };
  result.verdicts = result.verdicts || {};
  for (const [key, fallback] of Object.entries(verdictDefaults)) {
    const labelInput = env[`INPUT_LABEL_${key.toUpperCase()}`];
    result.verdicts[key] = {
      label: labelInput || result.verdicts[key]?.label || fallback,
    };
  }

  result.timezone = env.INPUT_TIMEZONE || result.timezone || 'America/New_York';

  return result;
}


async function main() {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const [owner, repo] = process.env.REPO.split('/');
  const prNumber = parseInt(process.env.PR_NUMBER, 10);

  // Read the review result produced by the engine
  const result = applyPresentationInputs(
    JSON.parse(fs.readFileSync(process.env.RESULT_FILE, 'utf8'))
  );

  // Handle skipped reviews — don't post a comment
  if (result.skipped) {
    console.log(`Review skipped: ${result.reason}`);
    console.log(`Files: ${result.files.join(', ')}`);
    return;
  }

  // Find existing Open Review comment or create new one
  const existingComment = await findExistingReviewComment(octokit, owner, repo, prNumber);

  // Determine version
  const currentVersion = existingComment ? extractVersion(existingComment.body) : 0;
  const newVersion = currentVersion + 1;

  // Fetch PR metadata for file links
  let baseUrl = '';
  try {
    const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
    baseUrl = `https://github.com/${owner}/${repo}/blob/${pr.head.sha}/`;
  } catch (error) {
    console.warn('Could not fetch PR metadata for file links:', error.message);
  }

  // Format for GitHub
  const comment = formatForGitHub(result, newVersion, baseUrl);

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
