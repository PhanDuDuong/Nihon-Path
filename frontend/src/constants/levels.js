export const jlptLevels = {
  1: "N5",
  2: "N4",
  3: "N3",
  4: "N2",
  5: "N1",
};

export function getLevelName(levelId) {
  return jlptLevels[levelId] ?? `Level ${levelId ?? "?"}`;
}
