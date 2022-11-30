"use strict";

const { Client, Pool } = require("pg");
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

const materialViewUpdate = require("./src/materialViewUpdate");
const materialViewUpdateHandler = async (event) => {
  await materialViewUpdate(client);
};

const barsViewUpdate = require("./src/barsViewUpdate");
const barsViewUpdateHandler = async (event) => {
  const pool = new Pool({ max: 6 })
  pool.connect()
  await barsViewUpdate(pool);
};



module.exports = {
  updatePriceHandler,
  updateTokenHandler,
  candleUpdateHandler,
  materialViewUpdateHandler,
  barsViewUpdateHandler,
};
