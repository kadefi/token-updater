const { makePactCall } = require("../pact");
const { GraphQLClient, gql } = require("graphql-request");
const format = require("pg-format");

const getTokens = `SELECT address FROM token_info;`;
const insertQuery = `
INSERT INTO dex_info (token_address, dex)
VALUES %L
ON CONFLICT ON CONSTRAINT unique_key 
DO NOTHING;
`;

const getKaddexTokens = async () => {
  const pairResponse = await makePactCall("2", `(kaddex.tokens.get-tokens)`);
  const pairs = pairResponse.result.data.map((pair) => pair.split(":"));
  const set = new Set();
  pairs.forEach((pair) => {
    set.add(pair[0]);
    set.add(pair[1]);
  });
  return set;
};

const getKDSwapTokens = async () => {
  const gClient = new GraphQLClient(
    "https://kdswap-fd-prod-cpeabrdfgdg9hzen.z01.azurefd.net/graphql/graphql"
  );
  const query = gql`
    query getAllTokens {
      tokens {
        id
        code
        tokenName
        tokenSymbol
        icon
        validated
        tokenInfo {
          decimalsToDisplay
        }
      }
    }
  `;
  const data = await gClient.request(query, {});

  const set = new Set();
  data.tokens
    .filter((token) => token.validated)
    .forEach((token) => {
      set.add(token.code);
    });
  return set;
};

const tokenUpdate = async (client) => {
  try {
    const kaddexSet = await getKaddexTokens();
    const kdSwapSet = await getKDSwapTokens();

    if (kaddexSet.size === 0 || kdSwapSet.size === 0) {
      return;
    }
    const queryRes = await client.query(getTokens);
    const intTokens = queryRes.rows.map((row) => row.address);
    const rows = intTokens.reduce((p, token) => {
      if (kaddexSet.has(token)) {
        p.push([token, "kaddex"]);
      }
      if (kdSwapSet.has(token)) {
        p.push([token, "kdswap"]);
      }
      return p;
    }, []);

    const res = await client.query(format(insertQuery, rows));
    console.log(res.rowCount);
  } catch (e) {
    console.log(e);
    console.log("error happaend");
  }
};

module.exports = tokenUpdate;
