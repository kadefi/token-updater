const { default: axios } = require("axios");
const { DateTime } = require("luxon");
const { getPriceFromCoinGecko } = require("../helpers");

const insertQuery = `
INSERT INTO kda_price(timestamp, price)
VALUES ($1, $2) 
ON CONFLICT (timestamp) DO UPDATE SET price = excluded.price
RETURNING *
`;

const API_URL =
  "https://www.kucoin.com/_api/order-book/candles?symbol=KDA-USDT&type=1min";

const getLatestPriceFromKucoin = async () => {
  const currMin = DateTime.now().startOf("minute");
  const begin = currMin.toSeconds();
  const end = currMin.plus({ minutes: 1 }).toSeconds();
  const priceRes = await axios.get(`${API_URL}&begin=${begin}&end=${end}`);
  const priceObj = priceRes.data;
  console.log(priceObj);
  const price = priceObj.data[0][4];
  return parseFloat(price);
};

const getLatestFromGate = async () => {
  const currMin = DateTime.now().startOf("minute");
  const begin = currMin.toSeconds();
  const end = currMin.plus({ minutes: 1 }).toSeconds();
  const priceRes = await axios.get(
    `https://www.gate.io/json_svr/query/?u=10&c=9646628&type=tvkline&symbol=kda_usdt&from=${begin}&to=${end}&interval=60`
  );
  const data = priceRes.data.split("\n");
  return parseFloat(data[1].split(",")[4]);
};

const updatePrice = async (client) => {
  let retryTimes = 0;
  const currMinute = new Date();
  currMinute.setSeconds(0);
  currMinute.setMilliseconds(0);

  let done = false;
  while (retryTimes < 5) {
    try {
      console.log("getting kda price from kucoin");
      const kdaPrice = await getLatestFromGate();
      console.log("price is " + kdaPrice);
      const values = [currMinute, kdaPrice];
      console.log(`adding values to postgres, ${currMinute}`);
      await client.query(insertQuery, values);
      done = true;
      console.log(`added`);
      break;
    } catch (e) {
      console.log(e);
      retryTimes += 1;
      await new Promise((r) => setTimeout(r, 1000));
      console.log(
        "FAILED TO UPDATE USING KUCOIN, RETRYING " + retryTimes + " times"
      );
    }
  }

  if (!done) {
    while (retryTimes < 10) {
      try {
        console.log("getting kda price from coingecko");
        const kdaPrice = await getPriceFromCoinGecko();
        console.log("price is " + kdaPrice);
        const values = [currMinute, kdaPrice];
        console.log(`adding values to postgres, ${currMinute}`);
        await client.query(insertQuery, values);
        done = true;
        console.log(`added`);
        break;
      } catch (e) {
        retryTimes += 1;
        console.log(e);
        await new Promise((r) => setTimeout(r, 1000));
        console.log(
          "FAILED TO UPDATE FROM CGKO, RETRYING " + retryTimes + " times"
        );
      }
    }
  }
};

module.exports = updatePrice;
