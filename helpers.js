const retryModule = require("async-retry");
const axios = require("axios");

const getPriceFromCoinGecko = async () => {
  const resp = await get(
    `https://api.coingecko.com/api/v3/simple/price?ids=kadena&vs_currencies=usd`
  );
  const price = resp["kadena"]["usd"];
  return price;
};

async function retry(func) {
  return retryModule(func, {
    retries: 3,
  });
}

async function get(endpoint) {
  return (await retry(async () => await axios.get(endpoint))).data;
}

module.exports = { getPriceFromCoinGecko };
