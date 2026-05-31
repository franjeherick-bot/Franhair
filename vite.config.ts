import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import AdmZip from 'adm-zip';
import fs from 'fs';

// Custom plugin to zip the project automatically
function zipProjectPlugin() {
  return {
    name: 'zip-project-plugin',
    buildStart() {
      try {
        const zip = new AdmZip();
        const rootDir = process.cwd();
        const excludeDirs = ['node_modules', 'dist', '.git', 'public'];
        const excludeFiles = ['project.zip', 'package-lock.json'];

        function addDirectoryToZip(localPath: string, zipPath = '') {
          const items = fs.readdirSync(localPath);

          for (const item of items) {
            const fullLocalPath = path.join(localPath, item);
            const relativeZipPath = zipPath ? `${zipPath}/${item}` : item;
            
            // Skip folder excludes at the root base level
            if (zipPath === '' && excludeDirs.includes(item)) {
              continue;
            }

            const stat = fs.statSync(fullLocalPath);
            if (stat.isDirectory()) {
              addDirectoryToZip(fullLocalPath, relativeZipPath);
            } else {
              if (excludeFiles.includes(item)) {
                continue;
              }
              zip.addLocalFile(fullLocalPath, zipPath);
            }
          }
        }

        const publicDir = path.join(rootDir, 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir);
        }

        addDirectoryToZip(rootDir);
        zip.writeZip(path.join(publicDir, 'project.zip'));
        console.log('✅ Project successfully zipped to ./public/project.zip');
      } catch (err) {
        console.error('Failed to zip project:', err);
      }
    }
  };
}

export default defineConfig(() => {
  const plugins = [react(), tailwindcss()];
  if (process.env.VERCEL !== '1') {
    plugins.push(zipProjectPlugin());
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
