import { useEffect, useSyncExternalStore } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { map } from './MapView';
import { mapImages, preparePhotoIcons } from './preloadImages';

const requested = new Set();
const listeners = new Set();
let available = new Set();

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => available;

const loadCategory = async (category) => {
  requested.add(category);
  try {
    const keys = await preparePhotoIcons(category);
    keys.forEach((key) => {
      if (!map.hasImage(key)) {
        try {
          map.addImage(key, mapImages[key], { pixelRatio: window.devicePixelRatio });
        } catch {
          // Style is loading; initMap adds it from mapImages
        }
      }
    });
    available = new Set(available).add(category);
    listeners.forEach((listener) => listener());
  } catch {
    // No photo for this category, keep the default icon
  }
};

// Returns the set of device categories that have a photo icon loaded on the map
export default () => {
  const categories = useSelector(
    (state) =>
      [
        ...new Set(
          Object.values(state.devices.items)
            .map((device) => device.category)
            .filter(Boolean),
        ),
      ].sort(),
    shallowEqual,
  );

  useEffect(() => {
    categories.filter((category) => !requested.has(category)).forEach(loadCategory);
  }, [categories]);

  return useSyncExternalStore(subscribe, getSnapshot);
};
