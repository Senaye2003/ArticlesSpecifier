exports.handler = async (event) => {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "NEWS_API_KEY environment variable is not set" })
        };
    }

    const query = event.queryStringParameters && event.queryStringParameters.q;
    if (!query) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Missing 'q' query parameter" })
        };
    }

    const date = new Date();
    const toDate = date.toISOString().split("T")[0];
    date.setDate(date.getDate() - 30);
    const fromDate = date.toISOString().split("T")[0];

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${fromDate}&to=${toDate}&sortBy=publishedAt&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return {
            statusCode: response.status,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 502,
            body: JSON.stringify({ error: error.message })
        };
    }
};
