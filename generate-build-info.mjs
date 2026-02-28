// Generate the last date of website update via GitHub merge info
import { execSync } from "child_process";
import { writeFileSync } from "fs";

try {
  const date = execSync(
    "git log --merges -1 --format=%cd --date=format:'%Y-%m-%d'"
  )
    .toString()
    .trim();

  const content = `VITE_LAST_UPDATE=${date}\n`;

  writeFileSync(".env", content);

  console.log("✅ Build date injected:", date);
} catch (error) {
  console.error("❌ Error generating build info:", error);
}