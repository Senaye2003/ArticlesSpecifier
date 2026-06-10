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

    const classifyArticle = (article, keywords) => {
        const content = (article.title + " " + article.description).toLowerCase();
        return keywords.some(keyword => content.includes(keyword.toLowerCase()));
    };

    const populateNews = async (categories) => {
        for (const category of categories) {
            const section = createSection(category.id, category.id.replace("-", " ").toUpperCase());
            const articles = await fetchNews(category.query);

            const filteredArticles = articles.filter(article => classifyArticle(article, category.keywords));

            if (filteredArticles.length === 0) {
                const noArticlesMessage = document.createElement("p");
                noArticlesMessage.textContent = "No articles found.";
                section.appendChild(noArticlesMessage);
            } else {
                filteredArticles.forEach(article => {
                    section.appendChild(createArticle(article));
                });
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
