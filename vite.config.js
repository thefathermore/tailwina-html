import handlebars from 'vite-plugin-handlebars';
import handlebarsHelpers from 'handlebars-helpers';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

// Load data from JSON files in the data folder
const loadData = () => {
  const dataFolder = path.resolve(__dirname, 'src/data');
  if (!fs.existsSync(dataFolder)) {
    return {};
  }
  try {
    const files = fs.readdirSync(dataFolder);
    return files
      .filter((file) => file.endsWith('.json'))
      .reduce((data, file) => {
        const filePath = path.join(dataFolder, file);
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const name = path.basename(file, '.json');
        data[name] = fileData;
        return data;
      }, {});
  } catch (error) {
    console.warn('Error loading data files:', error);
    return {};
  }
};

// Dynamically load all HTML files from src/pages directory
const loadPages = () => {
  const pagesDir = path.resolve(__dirname, 'src/pages');
  const input = {};

  if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir);
    files.forEach((file) => {
      if (file.endsWith('.html')) {
        const name = path.basename(file, '.html');
        input[name] = path.resolve(pagesDir, file);
      }
    });
  }

  return input;
};

// Register custom Handlebars helpers
const helpers = {
  ...handlebarsHelpers(),
  // eq: (a, b) => a === b,
  concat: (...args) => args.slice(0, -1).join(''),
};

// Custom plugin to watch partials directory
const watchPartialsPlugin = () => {
  return {
    name: 'watch-partials',
    configureServer(server) {
      const partialsDir = path.resolve(__dirname, 'src/partials');

      // Watch the partials directory for changes
      server.watcher.add(partialsDir);
      server.watcher.on('change', (filePath) => {
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
      });
    },
  };
};

// Remove crossorigin attribute from built HTML tags (scripts/links)
const removeCrossoriginPlugin = () => {
  return {
    name: 'remove-crossorigin',
    apply: 'build',
    transformIndexHtml(html) {
      // Remove crossorigin attributes directly in the transformIndexHtml hook
      // This ensures the attributes are removed before the HTML is written to disk
      return html.replace(/\s+crossorigin(=("[^"]*"|'[^']*'|[^\s>]+))?/gi, '');
    },
    // Keep the generateBundle hook as a fallback to ensure all HTML files are processed
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.html') && typeof chunk.source === 'string') {
          // Remove crossorigin from link and script tags
          chunk.source = chunk.source.replace(
            /\s+crossorigin(=("[^"]*"|'[^']*'|[^\s>]+))?/gi,
            ''
          );
        }
      }
    },
  };
};

export default defineConfig({
  base: './',
  plugins: [
    tailwindcss(),
    handlebars({
      // This is the directory where your partials are located
      partialDirectory: path.resolve(__dirname, 'src/partials'),
      context: loadData(),
      reloadOnPartialChange: true,
      helpers, // <-- Register helpers here
    }),
    watchPartialsPlugin(),
    removeCrossoriginPlugin(),
  ],
  // This is the directory where your pages are located
  root: 'src/pages',
  publicDir: path.resolve(__dirname, 'public'),
  resolve: {
    // Ensure Vite can resolve paths correctly from src/pages root
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@js': path.resolve(__dirname, 'src/js'),
    },
  },
  server: {
    hmr: true,
    fs: {
      strict: false,
    },
  },
  build: {
    // this is the output directory for the generated files
    // these are the files you need to launch your site
    outDir: '../../dist',
    emptyOutDir: true,
    // Disable automatic injection of JS files into HTML head
    // manifest: false,
    // cssCodeSplit: true,
    // minify: true,
    // Disable automatic script injection
    // modulePreload: {
    //   polyfill: false,
    // },
    rollupOptions: {
      // Dynamically load all HTML files from src/pages
      input: loadPages(),
      output: {
        // Output JS files to js/ directory with hash for cache busting
        entryFileNames: 'js/main-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Keep CSS in assets/css, other assets in assets/
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Enable minification in production (default: true)
    minify: 'esbuild',
  },
});
