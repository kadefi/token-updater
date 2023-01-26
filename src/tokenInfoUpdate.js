const { GraphQLClient, gql } = require("graphql-request");
const { default: axios } = require("axios");
const { DateTime } = require("luxon");
const { makePactCall } = require("../pact");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const ddbClient = new DynamoDBClient({ region: "us-east-1" });
const CACHE_TABLE = process.env.TOKEN_INFO_TABLE || false;
const { stringify, parse } = require("zipson/lib");

const CDN_PATH = "https://cdn2.kadefi.money";

const getKDSwapCS = async (token) => {
  const gClient = new GraphQLClient(
    "https://kdswap-fd-prod-cpeabrdfgdg9hzen.z01.azurefd.net/graphql/graphql"
  );
  const q = gql`
    query getTokenStats($token: String!) {
      stats(token: $token) {
        circulatingSupply
        totalSupply
        tokenName
      }
    }
  `;
  const data = await gClient.request(q, { token });
  return parseFloat(data.stats.circulatingSupply);
};

const getKISHKBurns = async () => {
  const dataR = await axios.get(
    "https://data.kadefi.money/balance/free.kishu-ken_token-table/k:0000000000000000000000000000000000000000000000000000000000000000"
  );
  return dataR.data.balance;
};

const getKDXBurns = async () => {
  const todayDate = DateTime.now().toFormat("yyyy-LL-dd");
  const dataR = await axios.get(
    `https://analytics-api.kaddex.com/analytics/get-data?dateStart=${todayDate}&dateEnd=${todayDate}`
  );
  const burns = dataR.data[0].burn;
  return Object.keys(burns).reduce((p, key) => {
    p += burns[key];
    return p;
  }, 0);
};

const getKDXCS = async () => {
  const todayDate = DateTime.now().toFormat("yyyy-LL-dd");
  const dataR = await axios.get(
    `https://analytics-api.kaddex.com/analytics/get-data?dateStart=${todayDate}&dateEnd=${todayDate}`
  );
  return dataR.data[0].circulatingSupply.totalSupply;
};

const getFluxCS = async () => {
  const dataR = await axios.get(
    "https://explorer.runonflux.io/api/circulating-supply"
  );
  return dataR.data;
};

const getWIZACS = async () => {
  const d = await makePactCall("1", `(free.wiza.get-circulating-supply)`);
  if (d.result && d.result.status === "success") {
    return getReserve(d.result.data);
  }
  throw new Error("failed wiza");
};

const getCirculatingSupply = async () => {
  const [kdl, kds, kdx, flux, wiza] = await Promise.all([
    getKDSwapCS("kdlaunch.token"),
    getKDSwapCS("kdlaunch.kdswap-token"),
    getKDXCS(),
    getFluxCS(),
    getWIZACS(),
  ]);

  const circulatingSupply = {
    KDL: kdl,
    KDS: kds,
    KDX: kdx,
    FLUX: flux,
    WIZA: wiza,
    KISHK: -1,
  };

  return circulatingSupply;
};

const getTotalReductions = async () => {
  const [KDX, KISHK] = await Promise.all([getKDXBurns, getKISHKBurns]);
  return {
    KDX,
    KISHK,
  };
};

const getTokens = async () => {
  const item = {
    TableName: "token-integrations",
    Key: {
      id: "tokens",
    },
  };
  const value = await ddbClient.send(new GetCommand(item));
  const { Item } = value;
  const { cachedValue } = Item;
  return typeof cachedValue === "string" || cachedValue instanceof String
    ? parse(cachedValue)
    : cachedValue;
};

const tokenInfoUpdate = async () => {
  try {
    console.log("gettting data")
    const [cs, red, tokens] = await Promise.all([getCirculatingSupply, getTotalReductions, getTokens])
    
    const allTokens = tokens.map((token) => {
      const totalSupply = token.totalSupply ? token.totalSupply - red[token.ticker] : null;
      const tempToken = Object.assign({}, token);
      const tokenWithCorrectTs = Object.assign(tempToken, { totalSupply })
      return {
        ...tokenWithCorrectTs,
        circulatingSupply: cs[token.ticker] === -1 ? totalSupply : cs[token.ticker] ? cs[token.ticker] : null,
        image: `${CDN_PATH}/tokens/${token.ticker}.png`,
      };
    });
    
    console.log("built tokens")
    const item = {
      TableName: CACHE_TABLE,
      Item: {
        id: "tokens",
        cachedValue: stringify(allTokens),
      },
    };
    console.log("updating")
    await ddbClient.send(new PutCommand(item)); 
    console.log("updated")
  } catch(e) {
    console.log(e.message)
  }

}

module.exports = tokenInfoUpdate;