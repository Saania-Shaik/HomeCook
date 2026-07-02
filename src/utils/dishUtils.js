export const DISH_STALE_HOURS = 24;

export const isDishStale = (dish) => {
  if (!dish?.createdAt) return false;
  const ageMs = Date.now() - new Date(dish.createdAt).getTime();
  return ageMs >= DISH_STALE_HOURS * 60 * 60 * 1000;
};

export const getDishPriceLabel = (dish) => {
  if (dish.isCustomListing) {
    return `₹${dish.price} total`;
  }
  return `₹${dish.price}/serving`;
};

export const getOrderTotal = (dish, quantity) => {
  if (dish.isCustomListing) {
    return dish.price;
  }
  return dish.price * quantity;
};

export const getDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  const parsedLat1 = parseFloat(lat1);
  const parsedLon1 = parseFloat(lon1);
  const parsedLat2 = parseFloat(lat2);
  const parsedLon2 = parseFloat(lon2);
  if (isNaN(parsedLat1) || isNaN(parsedLon1) || isNaN(parsedLat2) || isNaN(parsedLon2)) return null;
  if (parsedLat1 === 0 && parsedLon1 === 0) return null;
  if (parsedLat2 === 0 && parsedLon2 === 0) return null;

  const R = 6371; // Radius of the earth in km
  const dLat = (parsedLat2 - parsedLat1) * (Math.PI / 180);
  const dLon = (parsedLon2 - parsedLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(parsedLat1 * (Math.PI / 180)) *
      Math.cos(parsedLat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};
