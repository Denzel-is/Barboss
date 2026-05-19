export const SIX_CIRCLE_REQUIRED_COUNT = 6;

const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isSixCircleTaskTitle(title: string) {
  const normalized = title.toLocaleLowerCase("ru-RU");
  return normalized.includes("6 кружоч") || normalized.includes("шесть кружоч");
}

export function getMoscowDayRange(date = new Date()) {
  const moscowDate = new Date(date.getTime() + MOSCOW_OFFSET_MS);
  const startUtcMs =
    Date.UTC(moscowDate.getUTCFullYear(), moscowDate.getUTCMonth(), moscowDate.getUTCDate()) - MOSCOW_OFFSET_MS;

  return {
    start: new Date(startUtcMs),
    end: new Date(startUtcMs + DAY_MS),
  };
}

export function getSixCircleRewardSourceId(taskId: string, userId: string, date = new Date()) {
  const { start } = getMoscowDayRange(date);
  const dayKey = start.toISOString().slice(0, 10);
  return `six-circle:${taskId}:${userId}:${dayKey}`;
}
