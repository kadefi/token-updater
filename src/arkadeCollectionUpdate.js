const { default: axios } = require("axios")
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const ddbClient = new DynamoDBClient({ region: "us-east-1" });
const CACHE_TABLE = process.env.ARKADE_TABLE || false;


const arkadeCollectionUpdate = async () => {
  const d = await axios.get(
    "https://arkade-api.herokuapp.com/collection/all",
    {
      headers: {
        Origin: "https://www.arkade.fun",
      },
    }
  );
  const results = d.data.result;
  const item = {
    TableName: CACHE_TABLE,
    Item: {
      id: "ARKADE_COLLECTIONS",
      cachedValue: JSON.stringify(results),
    },
  };
  ddbClient.send(new UpdateCommand(item)); 
}
