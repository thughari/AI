# AI Studio App - README

Welcome to your AI Studio app! This guide will help you set up, run, and deploy your application with ease.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- 🤖 AI-powered code assistance and explanations
- 💻 Support for multiple programming languages
- 🔍 Real-time code suggestions
- 📚 Documentation lookups via Google Search
- 🎨 Clean, modern React TypeScript interface
- ⚡ Fast Vite-based development setup

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- A valid Gemini API key from Google AI Studio

---

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Create `.env.local` file:**
   ```sh
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

## Configuration

1. **Set up environment variables:**
   - Copy `.env.local.example` to `.env.local` if available:
     ```sh
     cp .env.local.example .env.local
     ```
   - Open `.env.local` and set your Gemini API key:
     ```
     GEMINI_API_KEY=your-gemini-api-key-here
     ```

---

## Running Locally

Start the development server:

```sh
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000) by default.

---

## Deployment

To deploy your app, follow the instructions for your preferred platform (e.g., Vercel, Netlify, or your own server):

1. Build the app:
   ```sh
   npm run build
   ```
2. Start the production server:
   ```sh
   npm start
   ```

This project is also configured for GitHub Pages deployment using GitHub Actions. Push to the `main` branch to trigger automatic deployment.

Make sure to:
1. Set `GEMINI_API_KEY` in your repository secrets
2. Enable GitHub Pages in your repository settings
3. Set the GitHub Pages source to the `gh-pages` branch

Ensure your environment variables are set in your deployment environment.

---

## Development

```sh
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Troubleshooting

- **Missing API Key:**  
  Make sure `GEMINI_API_KEY` is set in `.env.local`.
- **Port in use:**  
  Change the default port in your configuration or stop the conflicting process.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

Feel free to contribute or open issues for improvements!
