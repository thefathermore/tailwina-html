# Tailwina

Tailwina is a modern, clean HTML starter template built with **Tailwind CSS v4**, **Vite**, and **Handlebars**. Perfect for building fast, customizable static websites.

## 🚀 Features

- ⚡ **Vite** - Lightning-fast development server with HMR
- 🎨 **Tailwind CSS v4** - Utility-first CSS framework
- 📝 **Handlebars** - Minimal templating with partials support
- 🧩 **Zero Dependencies** - No jQuery or heavy frameworks
- 📱 **Responsive** - Mobile-first design approach
- 🔧 **Easy to Customize** - Clean, well-organized structure
- 📦 **Modern Build** - ES modules and modern JavaScript

## 📦 Installation

### Quick Start (Recommended)

The easiest way to start a new project is by using the CLI tool:

```bash
npx create-tailwina-html@latest
```

### Manual Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/thefathermore/tailwina-html.git
   cd tailwina-html
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or
   yarn install
   ```

3. **Start the development server**

   ```bash
   pnpm dev
   # or
   yarn dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Build for production**

   ```bash
   pnpm build
   # or
   yarn build
   ```

   Output files will be available in the `dist` directory.

5. **Preview the production build**

   ```bash
   pnpm preview
   # or
   yarn preview
   ```

## 📂 Project Structure

```
/
├── public/              # Static assets (images, favicons, etc.)
│   ├── css/            # Custom CSS files
│   │   └── custom.css # Your custom CSS entrypoint
│   └── js/             # JavaScript files
│       └── custom.js  # Your custom JS entrypoint
├── scripts/             # Node scripts (favicons, placeholders, media optimization)
├── src/
│   ├── data/           # JSON data injected into Handlebars templates
│   ├── pages/          # HTML pages (entry points)
│   │   ├── index.html # Home page
│   │   └── about.html # About page
│   ├── partials/       # Handlebars partials (reusable components)
│   │   ├── head.html  # HTML head section
│   │   └── layout-default.html # Default layout
│   ├── styles/         # CSS files
│   │   ├── main.css   # Main stylesheet with Tailwind imports
│   │   └── tailwind-config.css # Tailwind configuration
│   └── js/             # JavaScript source files
│       └── main.js    # Main JavaScript file
├── vite.config.js      # Vite configuration
└── package.json        # Project dependencies
```

## 🎨 Customization

### Tailwind Configuration

Customize your Tailwind theme by editing `src/styles/tailwind-config.css`:

```css
@theme {
  --font-sans: 'Inter', sans-serif;
  /* Add your custom colors, fonts, etc. */
}
```

### Adding Pages

Create new HTML files in `src/pages/` directory. Each file will be automatically processed by Vite and Handlebars.

Example:

```html
{{#> layout-default title="My Page" }}
<main>
  <h1>My New Page</h1>
</main>
{{/layout-default}}
```

### Using Partials

Partials are reusable Handlebars components located in `src/partials/`. Use them in your pages:

```html
{{> head title="My Page" }} {{> footer }}
```

### Custom Styles

Add your custom CSS in `src/styles/main.css` or create new CSS files and import them.

## 🛠️ Available Scripts

| Command                     | Action                                              |
| --------------------------- | --------------------------------------------------- |
| `pnpm dev`                  | Starts local dev server at localhost:5173           |
| `pnpm build`                | Build your production site to ./dist/               |
| `pnpm preview`              | Preview your build locally, before deploying        |
| `pnpm format`               | Format code with Prettier                           |
| `pnpm optim:image`          | Optimize images (uses `scripts/optimize-images.js`) |
| `pnpm optim:video`          | Optimize videos (uses `scripts/optimize-videos.js`) |
| `pnpm optim:media`          | Optimize images + videos                            |
| `pnpm generate:favicon`     | Generate favicons (outputs to `public/`)            |
| `pnpm generate:placeholder` | Generate placeholder images                         |

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to a Git repository
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect your Vite project
4. Deploy!

### Deploy to Netlify

1. Push your code to a Git repository
2. Import your repository in [Netlify](https://netlify.com)
3. Set build command: `pnpm build`
4. Set publish directory: `dist`
5. Deploy!

### Deploy to Static Hosting

1. Build your project: `pnpm build`
2. Upload the contents of the `dist` directory to your hosting provider

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/tailwina/issues).

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Handlebars](https://handlebarsjs.com/) - Minimal templating on steroids

---

Made with ❤️ for the web development community
