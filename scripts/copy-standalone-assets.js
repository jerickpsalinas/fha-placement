const fs = require("fs");
const path = require("path");

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

fs.mkdirSync(path.join(standalone, "public"), { recursive: true });
if (fs.existsSync(path.join(root, "public"))) {
  fs.cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
}
fs.cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });

const envLocal = path.join(root, ".env.local");
if (fs.existsSync(envLocal)) {
  fs.copyFileSync(envLocal, path.join(standalone, ".env.local"));
}
