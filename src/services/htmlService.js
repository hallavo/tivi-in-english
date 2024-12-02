const ejs = require("ejs");
const path = require("path");
const fs = require("fs").promises;

function processItems(filteredFeed) {
  return filteredFeed.map((item) => ({
    title: item.title,
    link: item.link,
    description: item.description || "",
    pubDate: item.pubDate,
    author: item.author || "Tivi",
    image: item.image,
    categories: item.categories || ["Tivi in English"],
  }));
}

async function generateHtml(filteredFeed) {
  const items = processItems(filteredFeed);
  console.log("Processed items:", items.length);

  const html = await ejs.renderFile(
    path.join(__dirname, "../../views/template.ejs"),
    { items }
  );

  await fs.writeFile(path.join(__dirname, "../../public/output.html"), html);
}

module.exports = {
  generateHtml,
};
