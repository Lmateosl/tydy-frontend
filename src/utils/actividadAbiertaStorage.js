const STORAGE_KEY = "tydyActividadAbierta";
const PROGRESS_PREFIX = "tydyActividadProgreso";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function safeParse(value) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getStoredUsuario() {
  if (!canUseStorage()) return null;
  return safeParse(window.localStorage.getItem("usuarioLogueado"));
}

export function getActividadAbiertaStorageKey(userId) {
  return `${STORAGE_KEY}:${userId}`;
}

export function getActividadProgressStorageKey(userId, historialId) {
  return `${PROGRESS_PREFIX}:${userId}:${historialId}`;
}

export function getActividadAbiertaGuardada(userId = getStoredUsuario()?.id) {
  if (!canUseStorage() || !userId) return null;
  return safeParse(window.localStorage.getItem(getActividadAbiertaStorageKey(userId)));
}

export function guardarActividadAbierta({ userId = getStoredUsuario()?.id, listaActiva, historialId }) {
  if (!canUseStorage() || !userId) return;

  window.localStorage.setItem(
    getActividadAbiertaStorageKey(userId),
    JSON.stringify({
      userId,
      listaActiva,
      historialId,
      updatedAt: new Date().toISOString(),
    })
  );
}

export function limpiarActividadAbierta(userId = getStoredUsuario()?.id) {
  if (!canUseStorage() || !userId) return;
  window.localStorage.removeItem(getActividadAbiertaStorageKey(userId));
}

export function getActividadProgresoGuardado(userId = getStoredUsuario()?.id, historialId) {
  if (!canUseStorage() || !userId || !historialId) return null;
  return safeParse(window.localStorage.getItem(getActividadProgressStorageKey(userId, historialId)));
}

export function guardarActividadProgreso({ userId = getStoredUsuario()?.id, historialId, progreso }) {
  if (!canUseStorage() || !userId || !historialId) return;

  window.localStorage.setItem(
    getActividadProgressStorageKey(userId, historialId),
    JSON.stringify({
      ...progreso,
      updatedAt: new Date().toISOString(),
    })
  );
}

export function limpiarActividadProgreso(userId = getStoredUsuario()?.id, historialId) {
  if (!canUseStorage() || !userId || !historialId) return;
  window.localStorage.removeItem(getActividadProgressStorageKey(userId, historialId));
}
