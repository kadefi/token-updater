const { default: axios } = require("axios")
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const ddbClient = new DynamoDBClient({ region: "us-east-1" });
const CACHE_TABLE = process.env.ARKADE_TABLE || false;
const { stringify } = require("zipson/lib");

const arkadeCollectionUpdate = async () => {
  const d = await axios.get(
    "https://arkade-api.herokuapp.com/collection/all",
    {
      headers: {
        Origin: "https://www.arkade.fun",
      },
    }
  );
  const results = d.data.collections;
  console.log(`got ${results.length} collections`)
  const item = {
    TableName: CACHE_TABLE,
    Item: {
      id: "ARKADE_COLLECTIONS",
      cachedValue: stringify(results),
    },
  };
  ddbClient.send(new PutCommand(item)); 
}

module.exports = arkadeCollectionUpdate