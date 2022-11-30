
const barsViewUpdate = async (client) => {
  try {
    let i = 0;
    var intervalId = setInterval(async () => {
      console.log(`starting refresh ${i}`);
      await Promise.allSettled([
        client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY kaddex_bars_day_view;`),
        client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY kdswap_bars_day_view;`),
        client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY kaddex_bars_hour_view;`),
        client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY kdswap_bars_hour_view;`),
        client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY kaddex_bars_minute_view;`),
        client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY kdswap_bars_minute_view;`)
      ])
      console.log(`ending refresh ${i}`);
      i += 1;
      if(i === 6) {
        await client.end()
        clearInterval(intervalId);
      }
    }, 10000)
    

  } catch (e) {
    console.log(e);
    console.log("error happaend");
  }
};

module.exports = barsViewUpdate
