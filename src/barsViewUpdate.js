require('dotenv').config();

const doRefresh = async(client, dex, interval) => {
  console.log(`doing for ${dex} ${interval}`);
  console.time(`${dex}${interval}`)
  try {
    await client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${dex}_bars_${interval}_view;`)
  } catch(e) {
    console.log(e);
  }
  console.timeEnd(`${dex}${interval}`)
  console.log(`done for ${dex} ${interval}`);
}

const barsViewUpdate = async (client) => {
  try {
    let i = 0;
    for(let i = 0; i < 10; i++) {
      console.log(`starting refresh ${i}`);
      console
      await Promise.allSettled([
        // doRefresh(client, 'kaddex','day'),
        // doRefresh(client, 'kaddex','hour'),
        doRefresh(client, 'kaddex','minute'),
        // doRefresh(client, 'kdswap','day'),
        // doRefresh(client, 'kdswap','hour'),
        doRefresh(client, 'kdswap','minute'),
      ])

      console.log(`ending refresh ${i}`);
      await new Promise(r => setTimeout(r, 5000));
    }
    await client.end()
  } catch (e) {
    console.log(e);
    console.log("error happaend");
  }
};

module.exports = barsViewUpdate

