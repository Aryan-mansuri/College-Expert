# CollegeExpert.in

This project is a React application built with Vite, Tailwind CSS, and the Gemini API.

## Deploying to Vercel via GitHub

It is incredibly easy to deploy this application to Vercel. Follow these steps:

1. **Push to GitHub:**
   - Export this project to a GitHub repository (you can use the AI Studio export feature or push it manually).

2. **Import to Vercel:**
   - Go to [Vercel](https://vercel.com/) and log in with your GitHub account.
   - Click **"Add New..."** > **"Project"**.
   - Select the GitHub repository you just created.

3. **Configure Environment Variables:**
   - In the "Configure Project" section, expand the **"Environment Variables"** dropdown.
   - Add a new variable:
     - **Name:** `GEMINI_API_KEY`
     - **Value:** *(Paste your Gemini API key here)*
   - *Note: You can get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).*

4. **Deploy:**
   - Click the **"Deploy"** button.
   - Vercel will automatically detect that it's a Vite project, build it, and deploy it!

## Features

- **Vite:** Fast, modern build tool.
- **React Router:** SPA routing (configured for Vercel via `vercel.json`).
- **Gemini API:** AI-powered college insights.
- **Tailwind CSS:** Modern styling.

## Local Development

To run this project locally:

```bash
npm install
npm run dev
```

Make sure to create a `.env` file in the root directory and add your API key:
```env
GEMINI_API_KEY=your_api_key_here
```
