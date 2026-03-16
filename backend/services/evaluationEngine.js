const GITHUB_REPO_REGEX = /^https?:\/\/(www\.)?github\.com\/[^/\s]+\/[^/\s]+\/?$/i;

const LEVEL_RULES = {
  L3: ["index.html", "style.css", "styles.css", "script.js", "main.js"],
  L4: ["index.php", "server.js", "app.js", "package.json", "schema.sql", "database.sql"],
  L5: ["package.json", "src/app.jsx", "src/app.tsx", "pubspec.yaml", "lib/main.dart"],
};

function normalizeZipText(zipBuffer) {
  if (!Buffer.isBuffer(zipBuffer)) {
    return "";
  }
  return zipBuffer.toString("latin1").toLowerCase();
}

function validateSubmissionArtifacts({
  githubUrl = "",
  zipBuffer = null,
  level = "L3",
}) {
  const hasGithub = Boolean(String(githubUrl || "").trim());
  const hasZip = Buffer.isBuffer(zipBuffer);
  const issues = [];

  if (!hasGithub && !hasZip) {
    return {
      valid: false,
      message: "Provide either a valid GitHub repository URL or upload a real ZIP project file.",
      issues: ["No submission artifacts were provided."],
    };
  }

  if (hasGithub && !GITHUB_REPO_REGEX.test(String(githubUrl).trim())) {
    issues.push("GitHub repository link is invalid.");
  }

  if (hasZip) {
    const zipText = normalizeZipText(zipBuffer);
    const requiredHints = LEVEL_RULES[level] || LEVEL_RULES.L3;
    const detectedFiles = requiredHints.filter((fileName) => zipText.includes(fileName.toLowerCase()));

    if (zipBuffer.length < 512) {
      issues.push("Uploaded ZIP file is too small to contain a real project.");
    }
    if (!detectedFiles.length) {
      issues.push("Uploaded ZIP file does not contain recognizable project files.");
    }
  }

  return {
    valid: issues.length === 0,
    message:
      issues.length === 0
        ? "Submission artifacts look valid."
        : "Submission rejected. Please upload a real project file or provide a valid repository link.",
    issues,
  };
}

module.exports = { validateSubmissionArtifacts, GITHUB_REPO_REGEX };
