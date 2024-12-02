const express = require("express");
const router = express.Router();
const { TIVI_URL, USER_AGENT, ACCEPT_HEADER } = require("../config/constants");
const {
  fetchArticles,
  enrichArticleDetails,
} = require("../services/feedService");
const { generateHtml } = require("../services/htmlService");
const axios = require("axios");
const cheerio = require("cheerio");

router.get("/", (req, res) => {
  res.send(`
        <h1>Tivi in English Article Generator</h1>
        <p>Click <a href="/generate">here</a> to generate the latest articles.</p>
        <p>Or view the <a href="/output.html">latest generated articles</a>.</p>
    `);
});

router.get("/generate", async (req, res) => {
  try {
    const articles = await fetchArticles(TIVI_URL);
    const enrichedArticles = await enrichArticleDetails(articles);
    await generateHtml(enrichedArticles);

    res.send(
      `Articles processed and HTML generated successfully! 
            Found ${enrichedArticles.length} articles. 
            View them at <a href="/output.html">output.html</a>`
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error processing articles: " + error.message);
  }
});

router.get("/test", async (req, res) => {
  try {
    const response = await axios.get(TIVI_URL, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: ACCEPT_HEADER,
      },
    });
    res.send(`Successfully accessed the page. Length: ${response.data.length}`);
  } catch (error) {
    res.status(500).send(`Error accessing page: ${error.message}`);
  }
});

router.get("/debug", async (req, res) => {
  try {
    const searchUrl =
      'https://www.tivi.fi/api/search?q="Tivi+in+English"&offset=0&limit=20';

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    res.send({
      status: "success",
      totalHits: response.data?.total || 0,
      firstFewHits: response.data?.hits?.slice(0, 3) || [],
      rawResponse: response.data,
    });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: error.message,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      responseHeaders: error.response?.headers,
    });
  }
});

router.get("/raw", async (req, res) => {
  try {
    const response = await axios.get(TIVI_URL, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: ACCEPT_HEADER,
      },
    });
    res.send(`
      <pre>
        ${response.data.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
      </pre>
    `);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

router.get("/test-api", async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.tivi.fi/api/articles/list?tag=tivi-in-english&limit=1",
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
          "Content-Type": "application/json",
          Referer: "https://www.tivi.fi/aiheet/tivi-in-english",
          Origin: "https://www.tivi.fi",
        },
      }
    );
    res.send({
      status: "success",
      data: response.data,
    });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: error.message,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      responseHeaders: error.response?.headers,
    });
  }
});

router.get("/test-graphql", async (req, res) => {
  try {
    const graphqlQuery = {
      query: `
        query ArticlesByTag($tag: String!, $limit: Int!) {
          articlesByTag(tag: $tag, limit: $limit) {
            items {
              title
              url
            }
          }
        }
      `,
      variables: {
        tag: "tivi-in-english",
        limit: 1,
      },
    };

    const response = await axios.post(
      "https://www.tivi.fi/api/graphql",
      graphqlQuery,
      {
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/json",
          Accept: "application/json",
          Referer: "https://www.tivi.fi/aiheet/tivi-in-english",
          Origin: "https://www.tivi.fi",
        },
      }
    );

    res.send({
      status: "success",
      data: response.data,
    });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: error.message,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      responseHeaders: error.response?.headers,
    });
  }
});

module.exports = router;
