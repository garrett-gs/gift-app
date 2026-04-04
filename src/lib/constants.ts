export const OCCASION_TYPES = [
  { value: "birthday", label: "Birthday" },
  { value: "christmas", label: "Christmas" },
  { value: "wedding", label: "Wedding" },
  { value: "baby_shower", label: "Baby Shower" },
  { value: "anniversary", label: "Anniversary" },
  { value: "housewarming", label: "Housewarming" },
  { value: "graduation", label: "Graduation" },
  { value: "other", label: "Other" },
] as const;

export const PRIORITY_LABELS: Record<number, string> = {
  1: "Nice to Have",
  2: "Would Like",
  3: "Want",
  4: "Really Want",
  5: "Must Have",
};

export const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-gray-100 text-gray-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-green-100 text-green-700",
  4: "bg-orange-100 text-orange-700",
  5: "bg-red-100 text-red-700",
};

export const APP_NAME = "GIFT";
export const APP_DESCRIPTION = "Your universal gift registry";
