const axios = require('axios');

// This uses the exact page tokens and IDs you pulled earlier from your JSON data
const pagesToConnect = [
  { name: "Bluestone Placements", id: "960652620453721", token: "EAAeDhwLj4GYBRpSkT4u0OQB2iGZC9eRzZCxVkR2O1Twz6P19GThqNr72uoSfbSzl2HpQizrZCZBNbGF3TnX1NY8A8eL71ZBEBQEev3WbXVZC3UGicfZAQqfDfJ3t8CMrSgptLaV6ycbjDPPmX2X5OaDj8NR22goEwmd3ksCiqy1jYbyI2hMnutbXttcJ7ZAgb16znbKWFgZBy" },
  { name: "Bluestone Language Hub", id: "798882103317956", token: "EAAeDhwLj4GYBRoVEhpm7krT26RsvrUqV5U8NMiXWWxyIosQjwzkeTbMkZC8HMRRuNixuZAMJZBiTZCqACu2ZAs7VF8hE4HwFz4haZB4mlo7qETttLJPvkn87cZArdjcpZAS5iCi5kaIBsxtrko5K88pbGad9ZA6qceYAqrGY43ZAlpc6oEeLKZCGHJ82G55P0u7rRMBiCxvTKCx" },
  { name: "Bluestone Techpark", id: "884912191368488", token: "EAAeDhwLj4GYBRhgAKGu416ZCZCMJ54ykoZA7WRzMkNUsBSMgHjUFwzHwp0IZASbvgoGvdoxz7rjBp9Q8kzPboD7mItEJZAbbM47SwSRmie2BddlrZBep8tqd41Gwk9rQBWyXOQOcvri1u2yfqwFvH1YN3aRMdIipZAx3SFkoWCc8KGknZAeDoW10gYZBX6OtM5lwLrXKUpcxn" },
  { name: "Bluestone International Pre School", id: "835486679651886", token: "EAAeDhwLj4GYBRmPplSVyMGXZAh2cZAfQTJBU70hu0qSobP66tZAv2U2RYxzZCwCLkMgxTgP6jikjiq5aEKM1ZBffwcX5jOwjHliJWQHlFEzOsAz22kcXitbrjWxeiBJRZB16Qxz4zEjscEDCS9xTSKZAzyRcDKkUzxbZB1TTu9MTFR1YrLI2Q9IveUlrwzIj7QYZAOLVgqalZA" },
  { name: "Bluestone Group of Institutions", id: "902355596291561", token: "EAAeDhwLj4GYBRtD526miFyG0Ky5KlHAJPw8MLRDg9qo8vU0OxZAB9oWcIdlzdrmocL9Tf0oTk6yoXodIwQ5W19ZAoEg4NRydTQMYeZBqGH60gKWRSNp9Bhm2ON5YFY4qirTvVfviwWb9UkUnmuXZBlntVl17a4GWvZB8lBXj7r9LEM4vL0Jc4luc9PZAELF98HKtccZAYZBN" },
  { name: "Bluestone Elite Sports", id: "794545177065914", token: "EAAeDhwLj4GYBRmgZC1BvOWUix6B6NWiZAISUGxEgUHnFPCDu3ZCxHOcY0ClOU1M2DJh0uRk646ncSkKT7mUuutMIdlb5NXR5V2avKpD2UdxtZCchD8sZA8Vh2sHOdvZC8VJaesC1MlWXVZChPYvqOzTSBUy0wWzIZAdyiDzsJdvS9j94iVSgKyZBPCxDi0wYaOQno9im40QmC" },
  { name: "Bluestoneiasacademy", id: "748860194967018", token: "EAAeDhwLj4GYBRj6wiHcbhKE2rGUigMxVvrtBF7pg5BTe0Dq9qenvk0zrRtYj1ZCTTRuGNrqZBNnTXET24xD3oz1OkWUMKzuhYWywfBIBIiceSF4mBsc2Hrew5NZBhmMAKrIVrEyTvYTa41AWFPuNhezBCv8AZADtWL6fJOZBbiFWmPCokYEykFku6BzUz0c69vUIKvBy7" }
];

async function startBulkSubscription() {
  console.log(`🚀 Activating Webhook bridge for remaining ${pagesToConnect.length} pages...`);

  for (const page of pagesToConnect) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v25.0/${page.id}/subscribed_apps`,
        null,
        {
          params: {
            subscribed_fields: 'leadgen',
            access_token: page.token
          }
        }
      );

      if (response.data?.success) {
        console.log(`✅ LINKED: "${page.name}" is now streaming leads to your CRM.`);
      }
    } catch (error) {
      console.error(`❌ FAILED: "${page.name}" (${page.id}) - Error:`, error.response?.data?.error?.message || error.message);
    }
  }
  console.log("\n All operations completed.");
}

startBulkSubscription();