# News Categories

A website that collects recent news articles and sorts them into categories — Pro-Israel, Pro-Hamas, Democratic, Republican, Left, and Right — so you can compare how different sides cover the news.

**Live site:** https://newscategories.netlify.app

## What it does

- Pulls fresh articles from NewsAPI.org
- Sorts each article into the category it matches best
- Lets you archive articles to read later
- Has a newsletter signup and a contact form

## Main files

- `index.html` — the page
- `script.js` — fetches and sorts the articles
- `categories.json` — the categories and their keywords (edit this to change sorting)
- `netlify/functions/news.js` — gets the articles from NewsAPI without exposing the API key

## Run your own copy

1. Connect this repo to a Netlify site
2. Get a free API key at [newsapi.org](https://newsapi.org)
3. In Netlify, add an environment variable named `NEWS_API_KEY` with your key
4. In Netlify, go to Forms → Form notifications and add your email to receive contact messages
5. Deploy
