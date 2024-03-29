"use strict";

const { Client, Pool } = require("pg");

const updatePrice = require("./src/updatePrice");
const updatePriceHandler = async (event) => {
  const client = new Client();
  client.connect();

  await updatePrice(client);
};

const tokenUpdate = require("./src/tokenUpdate");
const updateTokenHandler = async (event) => {
  const client = new Client();
  client.connect();

  await tokenUpdate(client);
};

const candleUpdate = require("./src/candleUpdate");
const candleUpdateHandler = async (event) => {
  const client = new Client();
  client.connect();

  const { dex, base } = event;
  await candleUpdate(dex, client, base);
};

const materialViewUpdate = require("./src/materialViewUpdate");
const materialViewUpdateHandler = async (event) => {
  const client = new Client();
  client.connect();

  await materialViewUpdate(client);
};

const hourBarsUpdate = require("./src/hourBarsUpdate");
const hourBarsUpdateHandler = async (event) => {
  const client = new Client();
  client.connect();

  const { dex, base } = event;
  await hourBarsUpdate(dex, client, base);
};

const arkadeCollectionUpdate = require("./src/arkadeCollectionUpdate");
const arkadeCollectionUpdateHandler = async (event) => {
  await arkadeCollectionUpdate();
};

const tokenInfoUpdate = require("./src/tokenInfoUpdate");
const tokenInfoUpdateHandler = async (event) => {
  await tokenInfoUpdate();
};

module.exports = {
  updatePriceHandler,
  updateTokenHandler,
  candleUpdateHandler,
  materialViewUpdateHandler,
  hourBarsUpdateHandler,
  arkadeCollectionUpdateHandler,
  tokenInfoUpdateHandler,
};
