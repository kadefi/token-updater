const { DateTime } = require("luxon");
const format = require("pg-format");

const getTransactionMap = async (client, dex, kdaPriceMap, startMinute, endMinute, base) => {
  const transactionsResp = await client.query(
    `SELECT * FROM ${dex}_transactions WHERE timestamp >= $1 AND timestamp <= $2 ORDER BY timestamp ASC`,
    [startMinute.toJSDate(), endMinute.toJSDate()]
  );
  const transactionMap = transactionsResp.rows.reduce((p, row) => {
    const { timestamp,from_token,to_token,from_amount,to_amount,volume} = row;
    let v = volume;
    const fromAmount = parseFloat(from_amount);
    const toAmount = parseFloat(to_amount);
    if(base === 'kda') {
      v = from_token === 'coin' ? fromAmount : toAmount
    }
    if(parseFloat(v) < 0.00000001) {
      return p;
    }
    const address = from_token === "coin" ? to_token : from_token;
    const date = DateTime.fromJSDate(new Date(timestamp)).startOf("minute").toJSDate();
    const priceInKDA =
      from_token === "coin"
        ? fromAmount / toAmount
        : toAmount / fromAmount;

    let finalPrice = priceInKDA;
    if(base === 'usd') {
      let kdaMinute = date;
      while(!(kdaMinute in kdaPriceMap)) {
        kdaMinute = DateTime.fromJSDate(kdaMinute).minus({minutes:1}).toJSDate();
      }
      finalPrice = priceInKDA * kdaPriceMap[kdaMinute];
    }
    if (address in p) {
      const transactions = p[address];
      if (date in transactions) {
        transactions[date].volume += parseFloat(v);
        transactions[date].close = finalPrice;
        transactions[date].low = Math.min(transactions[date].low, finalPrice);
        transactions[date].high = Math.max(transactions[date].high, finalPrice);
        p[address] = transactions;
      } else {
        p[address][date] = {
          volume: parseFloat(v),
          timestamp,
          close: finalPrice,
          low: finalPrice,
          high: finalPrice,
        }
      }
    } else {
      p[address] = {};
      p[address][date] = {
        volume: parseFloat(v),
        timestamp,
        close: finalPrice,
        low: finalPrice,
        high: finalPrice,
      }
    }

    return p;
  }, {});

  return transactionMap;
}

const candleUpdate = async (dex, client, base = 'usd') => {
  const tableSuffix = base === 'usd' ? "" : "_kda"
  console.log(`Running candle update for ${dex}`)
  const endMinute = DateTime.now().startOf("minute");
  let startMinute = endMinute.minus({ minutes: 4 });

  console.log(`get tokens for dex ${dex}`)
  const tokensResp = await client.query(
    `SELECT ticker, address FROM token_info t INNER JOIN dex_info d ON t.address = d.token_address WHERE dex = $1 AND t.address != 'coin'`,
    [dex]
  );

  const tokens = tokensResp.rows;

  console.log(`get kda prices`)
  let kdaPriceMap = null;
  if(base === 'usd') {
    const kdaPriceResp = await client.query(
      "SELECT timestamp, price FROM kda_price WHERE timestamp >= $1 AND timestamp <= $2",
      [startMinute.toJSDate(), endMinute.toJSDate()]
    );
    kdaPriceMap = kdaPriceResp.rows.reduce((p, row) => {
      const { timestamp, price } = row;
      p[timestamp] = parseFloat(price);
      return p;
    }, {});
    console.log(`built kda price map`)
  }

  const transactionMap = await getTransactionMap(client, dex, kdaPriceMap, startMinute, endMinute, base);
  for(let token of tokens) {
    console.log(`Processing for ${token.ticker}`)
    let start = startMinute;
    const transactions = transactionMap[token.address];
    let candles = [];
    while(start <= endMinute) {
      let prevClose;
      if(start.equals(startMinute)) {
        const prevCloseR = await client.query(
          `SELECT close FROM ${dex}_price${tableSuffix} WHERE ticker = $1 AND timestamp < $2 ORDER BY timestamp DESC LIMIT 1`,
          [token.ticker, startMinute.toJSDate()]
        );
        prevClose = parseFloat(prevCloseR.rows[0].close);
      } else {
        prevClose = candles[candles.length - 1][5];
      }
      if(transactions && start.toJSDate() in transactions) {
        const info = transactions[start.toJSDate()];
        candles.push([
          token.ticker,
          start.toJSDate(),
          Math.min(info.low, prevClose),
          Math.max(info.high, prevClose),
          prevClose,
          info.close,
          info.volume,
        ]);
      } else {
        candles.push([
          token.ticker,
          start.toJSDate(),
          prevClose,
          prevClose,
          prevClose,
          prevClose,
          0,
        ]);
      }

      start = start.plus({minutes: 1});
    }

    console.log(`built ${candles.length} candles for ${token.ticker} for ${dex}`)
    const insertQuery = `
      INSERT INTO ${dex}_price${tableSuffix} (ticker, timestamp, low, high, open, close, volume) 
      VALUES %L 
      ON CONFLICT ON CONSTRAINT ticker_timestamp_const_${dex}${tableSuffix}
      DO UPDATE SET (ticker, timestamp, low, high, open, close, volume) = (EXCLUDED.ticker, EXCLUDED.timestamp, EXCLUDED.low, EXCLUDED.high, EXCLUDED.open, EXCLUDED.close, EXCLUDED.volume);
    `;
    const s = await client.query(format(insertQuery, candles));
    console.log(`inserted ${s.rowCount} candles for ${token.ticker} for ${dex}`);
  }
};

module.exports = candleUpdate;