export const imgUrl = (src) => (src && src.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${src}` : src);

export const FOOD_CATEGORIES = ["cucina", "pasta", "fritti", "grill", "insalate", "panini", "dolci"];
export const DRINK_CATEGORIES = ["salse", "bevande", "birre", "vini", "cocktail", "caffe"];
export const ALL_CATEGORIES = [...FOOD_CATEGORIES, ...DRINK_CATEGORIES];
export const LOCATIONS = ["malaga", "malta"];
