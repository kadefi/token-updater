
const materialViewUpdate = async (client) => {
  try {
    await client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY kaddex_hl_view;`)
    await client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY kdswap_hl_view;`)
  } catch (e) {
    console.log(e);
    console.log("error happaend");
  }
};

module.exports = materialViewUpdate
