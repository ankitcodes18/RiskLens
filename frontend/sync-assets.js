const fs = require('fs');
const path = require('path');

const rootAssets = path.resolve(__dirname, '..', 'assets');
const rootAssetsPublic = path.resolve(__dirname, '..', 'assets', 'public');
const frontendPublicAssets = path.resolve(__dirname, 'public', 'assets');
const appAssets = path.resolve(__dirname, 'src', 'app', 'assets');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function syncAssets() {
  ensureDir(frontendPublicAssets);

  // Ensure src/app/assets is linked or synced with public/assets
  if (!fs.existsSync(appAssets)) {
    try {
      fs.symlinkSync(frontendPublicAssets, appAssets, 'junction');
    } catch {
      ensureDir(appAssets);
    }
  }

  // Copy any files from root assets/public or root assets to public/assets
  const sourceFolders = [rootAssetsPublic, rootAssets];
  for (const folder of sourceFolders) {
    if (fs.existsSync(folder)) {
      try {
        const files = fs.readdirSync(folder);
        for (const file of files) {
          const src = path.join(folder, file);
          const stat = fs.statSync(src);
          if (stat.isFile()) {
            const dest = path.join(frontendPublicAssets, file);
            if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
              fs.copyFileSync(src, dest);
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  // If appAssets is a separate directory (not a junction/symlink), mirror between appAssets and public/assets
  try {
    const isLstat = fs.lstatSync(appAssets);
    if (!isLstat.isSymbolicLink()) {
      if (fs.existsSync(appAssets)) {
        const appFiles = fs.readdirSync(appAssets);
        for (const file of appFiles) {
          const src = path.join(appAssets, file);
          const stat = fs.statSync(src);
          if (stat.isFile()) {
            const dest = path.join(frontendPublicAssets, file);
            if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
              fs.copyFileSync(src, dest);
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }
}

syncAssets();
