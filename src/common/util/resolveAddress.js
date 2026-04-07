import fetchOrThrow from './fetchOrThrow';
import geocodingQueue from './geocodingQueue';
import { formatAddress } from './formatter';

const buildLongdoAddress = (data) => {
  const road = data.road || '';
  return `${road} ${data.subdistrict} ${data.district} ${data.province}`.trim();
};

export const resolveAddress = async ({
  latitude,
  longitude,
  originalAddress,
  server,
  coordinateFormat,
  useQueue = true,
  cache,
}) => {
  if (originalAddress) {
    return originalAddress;
  }

  const cacheKey = `${latitude},${longitude}`;
  if (cache?.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  let resolvedAddress = null;

  try {
    if (server?.attributes?.uselongdo && server?.attributes?.longdoapikey) {
      const fetchLongdo = async () => {
        const url = `https://api.longdo.com/map/services/address?lon=${longitude}&lat=${latitude}&noelevation=1&key=${server.attributes.longdoapikey}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      };

      const data = await (useQueue ? geocodingQueue.enqueue(fetchLongdo) : fetchLongdo());
      resolvedAddress = buildLongdoAddress(data);
    } else if (server?.geocoderEnabled) {
      const query = new URLSearchParams({ latitude, longitude });
      const response = await fetchOrThrow(`/api/server/geocode?${query.toString()}`);
      resolvedAddress = await response.text();
    }
  } catch {
    resolvedAddress = null;
  }

  const fallbackAddress = formatAddress({ latitude, longitude }, coordinateFormat);
  const address = resolvedAddress || fallbackAddress;
  if (cache) {
    cache.set(cacheKey, address);
  }

  return address;
};
