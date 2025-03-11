const fs = require("fs");
const cheerio = require("cheerio");

// Load HTML file
// const html = fs.readFileSync("index.htm", "utf8");

module.exports = function createSchema(html) {
  const $ = cheerio.load(html);
  const teams = $(".sph-FixturePodHeader_TeamName")
    .map((i, el) => $(el).text().trim())
    .get()
    .join(" - ");

  const validTexts = [
    "Player Shots On Target Over/Under",
    "Player Shots Over/Under",
    "Player Fouls Over/Under",
    "Player Tackles Over/Under",
  ];

  const matchingDivs = [];

  $(
    ".gl-MarketGroupPod.cm-CouponPlayerSubMarketGrid_MarketGroup.gl-MarketGroup"
  ).each((_, el) => {
    const textContent = $(el)
      .find(".cm-MarketGroupWithIconsButton_Text")
      .text()
      .trim();

    if (validTexts.includes(textContent)) {
      matchingDivs.push({ category: textContent, html: $.html(el) });
    }
  });

  let extractedData = [];

  function extractDivs(elements) {
    elements.forEach(({ category, html }) => {
      const marketGroupContainer = $(html).find(".gl-MarketGroupContainer");

      const innerDivs = marketGroupContainer
        .children("div")
        .map((_, div) => $.html(div))
        .get();

      extractedData.push({ category, innerDivs });
    });
  }

  extractDivs(matchingDivs);

  function processMarketData(data) {
    return data.map(({ category, innerDivs }) => {
      const playerNames = [];
      const overData = [];
      const underData = [];

      innerDivs.forEach((div) => {
        const columnHeader = $(div)
          .find(".gl-MarketColumnHeader")
          .text()
          .trim();

        if (!columnHeader) {
          // Extract player names
          $(div)
            .find(".srb-ParticipantLabelWithTeam_Name")
            .each((_, el) => playerNames.push($(el).text().trim()));
        } else {
          // Extract Over / Under Data
          const results = [];
          $(div)
            .find(".gl-ParticipantCenteredStacked")
            .each((_, el) => {
              const handicap = $(el)
                .find(".gl-ParticipantCenteredStacked_Handicap")
                .text()
                .trim();
              const odds = $(el)
                .find(".gl-ParticipantCenteredStacked_Odds")
                .text()
                .trim();

              if (handicap && odds) {
                results.push({ handicap, odds });
              }
            });

          if (columnHeader.toLowerCase().includes("over")) {
            overData.push(...results);
          } else if (columnHeader.toLowerCase().includes("under")) {
            underData.push(...results);
          }
        }
      });

      // Combine player names with Over/Under Data
      const players = playerNames.map((name, index) => ({
        playerName: name,
        over: overData[index] || null,
        under: underData[index] || null,
      }));

      return { category, players };
    });
  }

  const processedMarketData = processMarketData(extractedData);

  fs.writeFileSync(
    `${teams}.json`,
    JSON.stringify(processedMarketData, null, 2)
  );
};
