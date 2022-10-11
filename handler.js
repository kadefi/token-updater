"use strict";

const { Client } = require("pg");
const client = new Client();
client.connect();

const updatePrice = require("./src/updatePrice");
const updatePriceHandler = async (event) => {
  updatePrice(client);
};

const tokenUpdate = require("./src/tokenUpdate");
const updateTokenHandler = async (event) => {
  await tokenUpdate(client);
};

module.exports = {
  updatePriceHandler,
  updateTokenHandler,
};
