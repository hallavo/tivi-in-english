const puppeteer = require("puppeteer");

async function fetchArticles(url) {
  let browser;
  let page;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"],
    });
    page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });

    // Block unnecessary resources to speed up loading
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (
        ["image", "stylesheet", "font", "script"].includes(
          request.resourceType()
        )
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log("Going to page:", url);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Accept cookie consent if present
    try {
      await page.evaluate(() => {
        const acceptButton = document.querySelector(
          'button[title="Accept all"]'
        );
        if (acceptButton) {
          acceptButton.click();
        }
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(
        "No cookie consent dialog found or error handling it:",
        error.message
      );
    }

    // Wait for content to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Extract articles
    const articles = await page.evaluate(() => {
      const items = [];
      const seen = new Set(); // To track unique articles

      // Find all article links
      document.querySelectorAll('a[href*="/uutiset/"]').forEach((link) => {
        const title = link.textContent.trim();
        const href = link.getAttribute("href");
        const articleContainer = link.closest("article") || link.parentElement;

        // Look for "Tivi in English" text near the article
        const articleText = articleContainer.textContent.toLowerCase();

        // Helper function to clean title
        const cleanTitle = (title) => {
          return title
            .replace(/\d{1,2}\.\d{1,2}\.(\s*\d{4})?.*$/, "") // Remove date in format dd.mm.yyyy or dd.mm.
            .replace(/Tivi in English.*$/, "") // Remove "Tivi in English"
            .replace(/^\d+/, "") // Remove leading numbers
            .replace(/\d+:\d+.*$/, "") // Remove time stamps
            .replace(/Tilaajille.*$/, "") // Remove "Tilaajille" and following text
            .replace(/\s*\([^)]*\)\s*/g, " ") // Remove parentheses and their content
            .replace(/\d{2}\.\d{2}\./g, "") // Remove dates in format dd.mm.
            .replace(/\s+/g, " ") // Normalize whitespace
            .trim();
        };

        // Check if this is an English article
        const isEnglish =
          // Check if the title is in English by looking for English words
          (/\b(the|and|or|in|of|to|for|with|by|at|from|has|have|had|will|been|are|is)\b/i.test(
            title
          ) &&
            // And doesn't contain Finnish characters
            !/[äöåÄÖÅ]/.test(title)) ||
          // Or if it's explicitly marked as English
          (articleText.includes("tivi in english") &&
            // But only if the title doesn't contain Finnish characters
            !/[äöåÄÖÅ]/.test(title));

        const cleanedTitle = cleanTitle(title);

        // Only add if it's English, has a title, and we haven't seen it before
        if (cleanedTitle && href && isEnglish && !seen.has(href)) {
          seen.add(href);
          items.push({
            title: cleanedTitle,
            link: href.startsWith("http") ? href : `https://www.tivi.fi${href}`,
            description: "",
            pubDate: new Date().toLocaleDateString(),
            author: "Tivi",
            image: null,
            categories: ["Tivi in English"],
          });
        }
      });

      return items;
    });

    console.log(`Found ${articles.length} articles`);
    if (articles.length > 0) {
      console.log("Sample articles:", articles.slice(0, 2));
    } else {
      const html = await page.content();
      console.log("Page content sample:", html.substring(0, 500));
    }

    return articles;
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function enrichArticleDetails(articles) {
  return articles;
}

module.exports = {
  fetchArticles,
  enrichArticleDetails,
};
