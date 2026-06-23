// Convert `?` placeholders into Postgres positional params ($1, $2, …).
const paramize = (query) => {
  let i = 0;
  return query.replace(/\?/g, () => `$${++i}`);
};

module.exports = { paramize };
