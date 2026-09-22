import type { LoginResponse, PublicAccount } from "@/lib/identity";
import type { Office } from "@/lib/offices";

const ACCESS_KEY = "bnv.access_token";
const REFRESH_KEY = "bnv.refresh_token";
const ACCOUNT_KEY = "bnv.account";
const WORKSPACE_KEY = "bnv.workspace";

function storage(remember: boolean) {
  return remember ? window.localStorage : window.sessionStorage;
}

function otherStorage(remember: boolean) {
  return remember ? window.sessionStorage : window.localStorage;
}

function sessionStore() {
  if (window.localStorage.getItem(ACCESS_KEY)) {
    return window.localStorage;
  }
  if (window.sessionStorage.getItem(ACCESS_KEY)) {
    return window.sessionStorage;
  }
  return window.sessionStorage;
}

export function saveSession(result: LoginResponse, remember: boolean) {
  const store = storage(remember);
  const leftover = otherStorage(remember);

  store.setItem(ACCESS_KEY, result.access_token);
  store.setItem(REFRESH_KEY, result.refresh_token);
  store.setItem(ACCOUNT_KEY, JSON.stringify(result.account));
  leftover.removeItem(ACCESS_KEY);
  leftover.removeItem(REFRESH_KEY);
  leftover.removeItem(ACCOUNT_KEY);
  leftover.removeItem(WORKSPACE_KEY);
  store.removeItem(WORKSPACE_KEY);
}

function read(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
}

export function getAccessToken() {
  return read(ACCESS_KEY);
}

export function getAccount(): PublicAccount | null {
  const raw = read(ACCOUNT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PublicAccount;
  } catch {
    return null;
  }
}

export function saveWorkspace(office: Office) {
  const store = sessionStore();
  const leftover =
    store === window.localStorage
      ? window.sessionStorage
      : window.localStorage;

  store.setItem(WORKSPACE_KEY, JSON.stringify(office));
  leftover.removeItem(WORKSPACE_KEY);
}

export function getWorkspace(): Office | null {
  const raw = read(WORKSPACE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const office = JSON.parse(raw) as Office;
    if (!office?.id || !office.company?.id) {
      return null;
    }
    return office;
  } catch {
    return null;
  }
}

export function clearWorkspace() {
  for (const store of [window.sessionStorage, window.localStorage]) {
    store.removeItem(WORKSPACE_KEY);
  }
}

export function clearSession() {
  for (const store of [window.sessionStorage, window.localStorage]) {
    store.removeItem(ACCESS_KEY);
    store.removeItem(REFRESH_KEY);
    store.removeItem(ACCOUNT_KEY);
    store.removeItem(WORKSPACE_KEY);
  }
}
