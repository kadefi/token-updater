const { getPriceFromCoinGecko } = require("../helpers");

const insertQuery = `
INSERT INTO kda_price(timestamp, price)
VALUES ($1, $2) 
ON CONFLICT (timestamp) DO UPDATE SET price = excluded.price
RETURNING *
`;

const updatePrice = async (client) => {
  let retryTimes = 0;
  const currMinute = new Date();
  currMinute.setSeconds(0);
  currMinute.setMilliseconds(0);

  while (retryTimes < 3) {
    try {
      console.log("getting kda price from coingecko");
      const kdaPrice = await getPriceFromCoinGecko();
      console.log("price is " + kdaPrice);
      const values = [currMinute, kdaPrice];
      console.log(`adding values to postgres, ${currMinute}`);
      await client.query(insertQuery, values);
      console.log(`added`);
      break;
    } catch (e) {
      retryTimes += 1;
      console.log("FAILED TO UPDATE, RETRYING " + retryTimes + " times");
    }
  }
};

module.exports = updatePrice;
