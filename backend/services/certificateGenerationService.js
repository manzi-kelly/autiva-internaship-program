const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const TEMPLATE_IMAGE_PATH =
  process.env.CERTIFICATE_TEMPLATE_PATH ||
  path.resolve(__dirname, "..", "..", "admin", "public", "celtificate.png");
const GENERATED_DIR = path.resolve(
  __dirname,
  "..",
  "assets",
  "certificates",
  "generated"
);

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function buildCertificateSvg({
  templateDataUri,
  qrDataUri,
  fullName,
  level,
  issueDate,
  certificateId,
}) {
  const safeName = escapeXml(fullName || "Student Name");
  const safeLevel = escapeXml(level || "L3");
  const safeDate = escapeXml(formatDate(issueDate));
  const safeCertificateId = escapeXml(certificateId);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1131" viewBox="0 0 1600 1131">
  <image href="${templateDataUri}" x="0" y="0" width="1600" height="1131" preserveAspectRatio="none" />
  <text x="800" y="556" text-anchor="middle" dominant-baseline="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="46" font-style="italic" font-weight="700" fill="#1f2937">${safeName}</text>
  <text x="842" y="724" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-size="28" fill="#1f2937">${safeLevel}</text>
  <text x="402" y="918" text-anchor="start" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-size="20" fill="#1f2937">${safeDate}</text>
  <rect x="1338" y="672" width="164" height="164" rx="12" fill="#ffffff" fill-opacity="0.95" />
  <image href="${qrDataUri}" x="1350" y="684" width="140" height="140" preserveAspectRatio="none" />
</svg>`;
}

function createDataUri(filePath) {
  const raw = fs.readFileSync(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
  return `data:${mimeType};base64,${raw.toString("base64")}`;
}

async function generateCertificateAsset({
  certificateId,
  fullName,
  level,
  issueDate,
  verificationUrl,
}) {
  if (!fs.existsSync(TEMPLATE_IMAGE_PATH)) {
    throw new Error(`Certificate template not found at ${TEMPLATE_IMAGE_PATH}`);
  }

  ensureDir(GENERATED_DIR);
  const templateDataUri = createDataUri(TEMPLATE_IMAGE_PATH);
  const qrDataUri = await QRCode.toDataURL(verificationUrl || certificateId, {
    margin: 2,
    width: 320,
    errorCorrectionLevel: "H",
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
  const svg = buildCertificateSvg({
    templateDataUri,
    qrDataUri,
    fullName,
    level,
    issueDate,
    certificateId,
  });

  const outputPath = path.join(GENERATED_DIR, `${certificateId}.svg`);
  fs.writeFileSync(outputPath, svg, "utf8");

  return {
    generatedPath: outputPath,
    generatedFormat: "svg",
  };
}

module.exports = {
  generateCertificateAsset,
};
