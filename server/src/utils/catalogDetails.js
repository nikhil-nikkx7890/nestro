// Shared by seedCatalog.js (new products) and backfillCatalogDetails.js
// (already-seeded products missing these fields) — kept in one place so
// the two scripts can't drift into generating different-looking data for
// the same category.

const SIZE_CLASSES = {
  small: { length: [35, 60], width: [35, 60], height: [40, 70], weight: [3, 10] },
  medium: { length: [80, 140], width: [45, 75], height: [45, 95], weight: [12, 35] },
  large: { length: [150, 220], width: [75, 180], height: [70, 220], weight: [35, 100] },
};

export const CATEGORY_SIZE_CLASS = {
  Sofas: "large",
  Beds: "large",
  "Dining Tables": "large",
  Chairs: "medium",
  Wardrobes: "large",
  Bookshelves: "large",
  "Coffee Tables": "medium",
  "TV Units": "medium",
  "Office Desks": "medium",
  "Bar Stools": "small",
  Recliners: "medium",
  Ottomans: "small",
  Nightstands: "small",
  "Bunk Beds": "large",
  "Rocking Chairs": "medium",
  "Console Tables": "medium",
  "Shoe Racks": "small",
  "Room Dividers": "medium",
  "Bean Bags": "small",
  "Study Tables": "medium",
  "Dressing Tables": "medium",
  "Kitchen Racks": "small",
  "Shoe Cabinets": "medium",
  "Side Tables": "small",
  "Garden Benches": "medium",
};

const randomInRange = ([min, max]) => Math.round(min + Math.random() * (max - min));

/** @returns {{length:number,width:number,height:number,unit:"cm"}} */
export const buildDimensions = (categoryName) => {
  const cls = SIZE_CLASSES[CATEGORY_SIZE_CLASS[categoryName] || "medium"];
  return {
    length: randomInRange(cls.length),
    width: randomInRange(cls.width),
    height: randomInRange(cls.height),
    unit: "cm",
  };
};

/** @returns {{value:number,unit:"kg"}} */
export const buildWeight = (categoryName) => {
  const cls = SIZE_CLASSES[CATEGORY_SIZE_CLASS[categoryName] || "medium"];
  return { value: randomInRange(cls.weight), unit: "kg" };
};

const WARRANTIES = ["1 Year", "2 Year", "5 Year"];
const CARE_LINES = [
  "Wipe with a dry, soft cloth. Avoid direct sunlight for long periods.",
  "Clean spills immediately with a damp cloth. Avoid harsh chemical cleaners.",
  "Dust regularly. Use a fabric-safe cleaner for any stains.",
];

/**
 * Product-level specs — deliberately material-agnostic (a Product owns
 * multiple Variants, each with its own material/color, ADR-005), so
 * nothing here names a specific material/finish the way a Variant's own
 * dimensions/weight can.
 */
export const buildSpecifications = (singularLabel) => [
  { key: "Assembly Required", value: Math.random() < 0.5 ? "Yes" : "No" },
  { key: "Package Contents", value: `1 x ${singularLabel}` },
  { key: "Warranty", value: `${WARRANTIES[Math.floor(Math.random() * WARRANTIES.length)]} Manufacturer Warranty` },
  { key: "Care Instructions", value: CARE_LINES[Math.floor(Math.random() * CARE_LINES.length)] },
];
