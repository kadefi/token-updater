"use strict";

const { Client } = require("pg");
const client = new Client();
client.connect();

const updatePrice = require("./src/updatePrice");
const updatePriceHandler = async (event) => {
  await updatePrice(client);
};

const tokenUpdate = require("./src/tokenUpdate");
const updateTokenHandler = async (event) => {
  await tokenUpdate(client);
};

const candleUpdate = require("./src/candleUpdate");
const candleUpdateHandler = async (event) => {
  const { dex } = event;
  await candleUpdate(dex, client);
};

module.exports = {
  updatePriceHandler,
  updateTokenHandler,
  candleUpdateHandler,
};
