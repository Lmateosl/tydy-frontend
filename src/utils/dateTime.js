export const BUSINESS_TIME_ZONE = "America/Guayaquil";

const BUSINESS_OFFSET_MINUTES = -5 * 60;
const BUSINESS_OFFSET_MS = BUSINESS_OFFSET_MINUTES * 60 * 1000;

function pad(value) {
  return String(value).padStart(2, "0");
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function buildBusinessDate(year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0) {
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - BUSINESS_OFFSET_MS
  );
}

export function getBusinessDateParts(date = new Date()) {
  const normalizedDate = date instanceof Date ? date : new Date(date);
  if (!isValidDate(normalizedDate)) return null;

  const businessDate = new Date(normalizedDate.getTime() + BUSINESS_OFFSET_MS);

  return {
    year: businessDate.getUTCFullYear(),
    month: businessDate.getUTCMonth() + 1,
    day: businessDate.getUTCDate(),
    hour: businessDate.getUTCHours(),
    minute: businessDate.getUTCMinutes(),
    second: businessDate.getUTCSeconds(),
    millisecond: businessDate.getUTCMilliseconds(),
  };
}

export function getBusinessPeriodRange(periodo, baseDate = new Date()) {
  const parts = getBusinessDateParts(baseDate);
  if (!parts) return { desde: null, hasta: null };

  const businessDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const desdeBusinessDay = new Date(businessDay);

  switch (periodo) {
    case "7dias":
      desdeBusinessDay.setUTCDate(desdeBusinessDay.getUTCDate() - 7);
      break;
    case "1mes":
      desdeBusinessDay.setUTCMonth(desdeBusinessDay.getUTCMonth() - 1);
      break;
    case "6meses":
      desdeBusinessDay.setUTCMonth(desdeBusinessDay.getUTCMonth() - 6);
      break;
    case "1anio":
      desdeBusinessDay.setUTCFullYear(desdeBusinessDay.getUTCFullYear() - 1);
      break;
    case "hoy":
    default:
      break;
  }

  return {
    desde: buildBusinessDate(
      desdeBusinessDay.getUTCFullYear(),
      desdeBusinessDay.getUTCMonth() + 1,
      desdeBusinessDay.getUTCDate(),
      0,
      0,
      0,
      0
    ),
    hasta: buildBusinessDate(parts.year, parts.month, parts.day, 23, 59, 59, 999),
  };
}

export function formatBackendDateTime(date) {
  const normalizedDate = date instanceof Date ? date : new Date(date);
  if (!isValidDate(normalizedDate)) return "";

  return normalizedDate.toISOString();
}

export function formatBusinessDateInput(date) {
  const parts = getBusinessDateParts(date);
  if (!parts) return "";

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function parseBusinessDateInput(value) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return null;

  return {
    desde: buildBusinessDate(year, month, day, 0, 0, 0, 0),
    hasta: buildBusinessDate(year, month, day, 23, 59, 59, 999),
  };
}

export function parseBusinessDateTimeInput(value) {
  if (!value) return null;

  const [datePart, timePart = "00:00:00"] = value.split("T");
  if (!datePart) return null;

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);
  if (![year, month, day, hour, minute, second].every(Number.isFinite)) return null;

  return buildBusinessDate(year, month, day, hour, minute, second, 0);
}
