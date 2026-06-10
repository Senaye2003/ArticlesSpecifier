document.addEventListener("DOMContentLoaded", () => {
    const newsContainer = document.getElementById("news-container");
    const archivedNewsletters = JSON.parse(localStorage.getItem('archivedNewsletters')) || [];
    const subscriberEmails = JSON.parse(localStorage.getItem('subscriberEmails')) || [];

    const createSection = (id, title) => {
        const section = document.createElement("section");
        section.id = id;

        const header = document.createElement("h2");
        header.textContent = title;
        section.appendChild(header);

        return section;
    };

    const createArticle = (article) => {
        const articleElement = document.createElement("article");

        const title = document.createElement("h3");
        title.textContent = article.title;
        articleElement.appendChild(title);

        const summary = document.createElement("p");
        summary.textContent = article.description;
        articleElement.appendChild(summary);

        const link = document.createElement("a");
        link.href = article.url;
        link.textContent = "Read more";
        link.target = "_blank";
        articleElement.appendChild(link);

        const archiveButton = document.createElement("button");
        archiveButton.textContent = "Archive";
        archiveButton.classList.add("btn", "btn-secondary", "ml-2");
        archiveButton.addEventListener("click", () => archiveArticle(article));
        articleElement.appendChild(archiveButton);

        return articleElement;
    };

    const createArchivedArticle = (article) => {
        const articleElement = document.createElement("article");

        const title = document.createElement("h3");
        const link = document.createElement("a");
        link.href = article.url;
        link.textContent = article.title;
        link.target = "_blank";
        title.appendChild(link);
        articleElement.appendChild(title);

        const unarchiveButton = document.createElement("button");
        unarchiveButton.textContent = "Unarchive";
        unarchiveButton.classList.add("btn", "btn-secondary", "ml-2");
        unarchiveButton.addEventListener("click", () => unarchiveArticle(article));
        articleElement.appendChild(unarchiveButton);

        return articleElement;
    };

    const archiveArticle = (article) => {
        archivedNewsletters.push(article);
        updateArchivedNewsletters();
        localStorage.setItem('archivedNewsletters', JSON.stringify(archivedNewsletters));
    };

    const unarchiveArticle = (article) => {
        const index = archivedNewsletters.findIndex(a => a.title === article.title);
        if (index > -1) {
            archivedNewsletters.splice(index, 1);
            updateArchivedNewsletters();
            localStorage.setItem('archivedNewsletters', JSON.stringify(archivedNewsletters));
        }
    };

    const updateArchivedNewsletters = () => {
        const archivedList = document.getElementById('archived-newsletters');
        archivedList.innerHTML = "";
        archivedNewsletters.forEach(newsletter => {
            archivedList.appendChild(createArchivedArticle(newsletter));
        });
    };

    const fetchNews = async (query) => {
        try {
            const url = `/.netlify/functions/news?q=${encodeURIComponent(query)}`;

            console.log(`Fetching news for query: ${query}`);

            const response = await fetch(url);
            const data = await response.json();
            if (!response.ok || data.status === "error") {
                throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
            }

            console.log(`Fetched ${data.articles.length} articles for query: ${query}`);
            return data.articles;
        } catch (error) {
            console.error(`Error fetching news for query: ${query}`, error);
            return [];
        }
    };

    // --- Categorization ---
    // Scores each article against every category using word-boundary matching
    // (so "IDF" can't match inside another word), keyword weights, title
    // emphasis, and optional exclude terms. Each article is assigned only to
    // its single best-scoring category, and duplicates are removed by URL.
    const MIN_SCORE = 3;          // minimum score to be categorized at all
    const MAX_PER_CATEGORY = 20;  // cap per section, best matches first

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const countMatches = (text, term) => {
        if (!text) return 0;
        const re = new RegExp(`\\b${escapeRegex(term)}\\b`, "gi");
        return (text.match(re) || []).length;
    };

    const scoreArticle = (article, category) => {
        let score = 0;
        for (const k of category.keywords) {
            const term = typeof k === "string" ? k : k.term;
            const weight = typeof k === "string" ? 1 : (k.weight || 1);
            score += countMatches(article.title, term) * 3 * weight; // title hits count triple
            score += countMatches(article.description, term) * weight;
        }
        for (const term of category.exclude || []) {
            score -= (countMatches(article.title, term) * 3 + countMatches(article.description, term)) * 2;
        }
        return score;
    };

    const populateNews = async (categories) => {
        // Fetch all category queries in parallel
        const results = await Promise.all(categories.map(c => fetchNews(c.query)));

        // Deduplicate by URL and assign each article to its best category
        const assigned = new Map();
        results.flat().forEach(article => {
            if (!article || !article.url || !article.title || article.title === "[Removed]") return;
            if (assigned.has(article.url)) return;

            let best = null;
            let bestScore = 0;
            for (const category of categories) {
                const s = scoreArticle(article, category);
                if (s > bestScore) {
                    bestScore = s;
                    best = category;
                }
            }
            if (best && bestScore >= MIN_SCORE) {
                assigned.set(article.url, { article, categoryId: best.id, score: bestScore });
            }
        });

        for (const category of categories) {
            const section = createSection(category.id, category.id.replace(/-/g, " ").toUpperCase());

            const items = [...assigned.values()]
                .filter(entry => entry.categoryId === category.id)
                .sort((a, b) =>
                    b.score - a.score ||
                    new Date(b.article.publishedAt) - new Date(a.article.publishedAt))
                .slice(0, MAX_PER_CATEGORY);

            if (items.length === 0) {
                const noArticlesMessage = document.createElement("p");
                noArticlesMessage.textContent = "No articles found.";
                section.appendChild(noArticlesMessage);
            } else {
                items.forEach(entry => section.appendChild(createArticle(entry.article)));
            }

            newsContainer.appendChild(section);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('categories.json'); // Adjust the path if necessary
            const categories = await response.json();
            populateNews(categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    fetchCategories();

    // Newsletter form submission
    const newsletterForm = document.querySelector('#newsletter-form');
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.querySelector('#newsletter #email').value;
        if (subscriberEmails.includes(email)) {
            alert('This email is already subscribed.');
        } else {
            subscriberEmails.push(email);
            localStorage.setItem('subscriberEmails', JSON.stringify(subscriberEmails));
            alert('Subscribed successfully!');
            sendEmailToWebsiteMaker(email);
        }
    });

    const sendEmailToWebsiteMaker = (email) => {
        console.log(`Simulating email to website maker: newscategoriesstx@gmail.com with new subscriber email: ${email}`);
        // Simulate sending email by logging to console
    };

    // Load archived newsletters on page load
    updateArchivedNewsletters();
});