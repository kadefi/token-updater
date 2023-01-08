
const materialViewUpdate = async (client) => {
  try {
    console.log("starting refresh");
    await client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY kaddex_hl_view;`)
    await client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY kdswap_hl_view;`)
    await client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY kdswap_hl_view_kda;`)
    await client.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY kdswap_hl_view_kda;`)
    console.log("ending refresh");
  } catch (e) {
    console.log(e);
    console.log("error happaend");
  }
};

module.exports = materialViewUpdate
