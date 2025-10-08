export const safeArrayLength = (arr: any[] | null | undefined): number => {
  return Array.isArray(arr) ? arr.length : 0;
};

export const safeFilter = <T>(
  arr: T[] | null | undefined, 
  predicate: (value: T) => boolean
): T[] => {
  return Array.isArray(arr) ? arr.filter(predicate) : [];
};
