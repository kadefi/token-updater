"use strict";

const { default: axios } = require("axios");
const { Client } = require("pg");
const retryModule = require("async-retry");

const client = new Client();
client.connect();

const insertQuery = `
INSERT INTO kda_price(timestamp, price)
VALUES ($1, $2) 
RETURNING *
`;

const updatePrice = async (event) => {
  console.log("getting kda price from coingecko");
  const kdaPrice = await getPriceFromCoinGecko();
  console.log("price is " + kdaPrice);
  const currMinute = new Date();
  currMinute.setSeconds(0);
  currMinute.setMilliseconds(0);
  const values = [currMinute, kdaPrice];
  console.log(`adding values to postgres, ${currMinute}`);
  await client.query(insertQuery, values);
  console.log(`added`);
};

const getPriceFromCoinGecko = async () => {
  const resp = await get(
    `https://api.coingecko.com/api/v3/simple/price?ids=kadena&vs_currencies=usd`
  );
  const price = resp["kadena"]["usd"];
  return {
    price,
  };
};

async function retry(func) {
  return retryModule(func, {
    retries: 3,
  });
}

async function get(endpoint) {
  return (await retry(async () => await axios.get(endpoint))).data;
}

module.exports = {
  updatePrice,
};
