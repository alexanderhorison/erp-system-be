const { Cache } = require('../models');
const moment = require('moment');

const CACHE_KEYS = {
  /**
   * Monthly finance revenue
   * Example: REVENUE_8_2025
   */
  FINANCE_REVENUE: (month, year) => `REVENUE_${month}_${year}`,
};

async function getCache(key) {
  return await Cache.findOne({ where: { key } });
}

async function setCache(key, value) {
  const now = moment().toDate();
  const stringified = typeof value === 'string' ? value : JSON.stringify(value);

  const existing = await Cache.findOne({ where: { key } });

  if (existing) {
    await existing.update({ value: stringified, storedAt: now });
    return existing;
  } else {
    const created = await Cache.create({ key, value: stringified, storedAt: now });
    return created;
  }
}
/**
 * 
 * @param {1} key Cache
 * @param {*} timeKey to console.time and console.timeEnd
 * @param {*} fetchFn Function to fetch data if cache is expired
 * @param {3 * 60 * 60 * 1000} expireInMs Expiration time in milliseconds, default is 3 hours
 * @returns 
 */
async function getOrSetCache(key, timeKey = "TimeCountFetch", fetchFn, expireInMs = 3 * 60 * 60 * 1000) {
  console.time(timeKey); // start timer
  const existing = await getCache(key);

  const isExpired = !existing || (moment().diff(moment(existing.storedAt)) > expireInMs);

  if (!isExpired) {
    try {
      console.timeEnd(timeKey); // end timer
      console.log("fetch with cache");
      return JSON.parse(existing.value);
    } catch {
      return existing.value;
    }
  }

  const freshValue = await fetchFn();
  await setCache(key, freshValue);
  console.timeEnd(timeKey); // end timer
  console.log("fetch with query");
  return freshValue;
}

module.exports = {
  CACHE_KEYS,
  getCache,
  setCache,
  getOrSetCache,
}