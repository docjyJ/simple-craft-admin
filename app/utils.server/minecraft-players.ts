import { readFile, writeFile } from 'node:fs/promises';
import { resolveSafePath } from '~/utils.server/path-validation';
import { getOrCreateServer } from '~/utils.server/server-minecraft';

export type MinecraftPlayerEntry = {
  name?: string;
  uuid?: string;
  [k: string]: unknown;
};

export type MinecraftBanEntry = {
  name?: string;
  uuid?: string;
  ip?: string;
  created?: string;
  source?: string;
  expires?: string;
  reason?: string;
  [k: string]: unknown;
};

async function readJsonArray<T>(path: string): Promise<T[]> {
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (e: any) {
    if (e?.code === 'ENOENT') return [];
    // si JSON invalide, on retourne vide pour rester robuste
    return [];
  }
}

async function writeJsonArray<T>(path: string, value: T[]): Promise<void> {
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export function isServerOnline(uid: string): boolean {
  return getOrCreateServer(uid).isRunning();
}

export async function listWhitelist(uid: string): Promise<MinecraftPlayerEntry[]> {
  return readJsonArray(resolveSafePath(uid, 'whitelist.json'));
}

export async function listOps(uid: string): Promise<MinecraftPlayerEntry[]> {
  return readJsonArray(resolveSafePath(uid, 'ops.json'));
}

export async function listBannedPlayers(uid: string): Promise<MinecraftBanEntry[]> {
  return readJsonArray(resolveSafePath(uid, 'banned-players.json'));
}

export async function listBannedIps(uid: string): Promise<MinecraftBanEntry[]> {
  return readJsonArray(resolveSafePath(uid, 'banned-ips.json'));
}

function normalizeValue(v: string) {
  return v.trim();
}

function byNameOrUuid(value: string) {
  const needle = normalizeValue(value).toLowerCase();
  return (e: { name?: string; uuid?: string }) => {
    const n = e.name?.toLowerCase();
    const u = e.uuid?.toLowerCase();
    return n === needle || u === needle;
  };
}

function displayName(e: { name?: string; uuid?: string; ip?: string }) {
  return e.name ?? e.ip ?? e.uuid ?? '';
}

export async function whitelistAdd(uid: string, value: string) {
  const v = normalizeValue(value);
  if (isServerOnline(uid)) {
    getOrCreateServer(uid).sendCommand(`whitelist add ${v}`);
    return;
  }
  const path = resolveSafePath(uid, 'whitelist.json');
  const arr = await readJsonArray<MinecraftPlayerEntry>(path);
  if (!arr.some(byNameOrUuid(v))) {
    // offline: on ne sait pas résoudre uuid vs pseudo, on stocke en "name" par défaut
    arr.push({ name: v });
    await writeJsonArray(path, arr);
  }
}

export async function whitelistRemove(uid: string, value: string) {
  const v = normalizeValue(value);
  if (isServerOnline(uid)) {
    getOrCreateServer(uid).sendCommand(`whitelist remove ${v}`);
    return;
  }
  const path = resolveSafePath(uid, 'whitelist.json');
  const arr = await readJsonArray<MinecraftPlayerEntry>(path);
  const next = arr.filter((e) => !byNameOrUuid(v)(e));
  await writeJsonArray(path, next);
}

export async function opAdd(uid: string, value: string) {
  const v = normalizeValue(value);
  if (isServerOnline(uid)) {
    getOrCreateServer(uid).sendCommand(`op ${v}`);
    return;
  }
  const path = resolveSafePath(uid, 'ops.json');
  const arr = await readJsonArray<MinecraftPlayerEntry>(path);
  if (!arr.some(byNameOrUuid(v))) {
    arr.push({ name: v, level: 4, bypassesPlayerLimit: false });
    await writeJsonArray(path, arr);
  }
}

export async function opRemove(uid: string, value: string) {
  const v = normalizeValue(value);
  if (isServerOnline(uid)) {
    getOrCreateServer(uid).sendCommand(`deop ${v}`);
    return;
  }
  const path = resolveSafePath(uid, 'ops.json');
  const arr = await readJsonArray<MinecraftPlayerEntry>(path);
  const next = arr.filter((e) => !byNameOrUuid(v)(e));
  await writeJsonArray(path, next);
}

export async function banPlayer(uid: string, value: string, reason?: string) {
  const v = normalizeValue(value);
  const r = (reason ?? '').trim();
  if (isServerOnline(uid)) {
    const cmd = r.length > 0 ? `ban ${v} ${r}` : `ban ${v}`;
    getOrCreateServer(uid).sendCommand(cmd);
    return;
  }
  const path = resolveSafePath(uid, 'banned-players.json');
  const arr = await readJsonArray<MinecraftBanEntry>(path);
  if (!arr.some(byNameOrUuid(v))) {
    arr.push({ name: v, reason: r || undefined, created: new Date().toISOString(), source: 'SimpleCraftAdmin' });
    await writeJsonArray(path, arr);
  }
}

export async function pardonPlayer(uid: string, value: string) {
  const v = normalizeValue(value);
  if (isServerOnline(uid)) {
    getOrCreateServer(uid).sendCommand(`pardon ${v}`);
    return;
  }
  const path = resolveSafePath(uid, 'banned-players.json');
  const arr = await readJsonArray<MinecraftBanEntry>(path);
  const next = arr.filter((e) => !byNameOrUuid(v)(e));
  await writeJsonArray(path, next);
}

export async function banIp(uid: string, ip: string, reason?: string) {
  const v = normalizeValue(ip);
  const r = (reason ?? '').trim();
  if (isServerOnline(uid)) {
    const cmd = r.length > 0 ? `ban-ip ${v} ${r}` : `ban-ip ${v}`;
    getOrCreateServer(uid).sendCommand(cmd);
    return;
  }
  const path = resolveSafePath(uid, 'banned-ips.json');
  const arr = await readJsonArray<MinecraftBanEntry>(path);
  if (
    !arr.some((e) => (e.ip ?? '').toLowerCase() === v.toLowerCase() || displayName(e).toLowerCase() === v.toLowerCase())
  ) {
    arr.push({ ip: v, reason: r || undefined, created: new Date().toISOString(), source: 'SimpleCraftAdmin' });
    await writeJsonArray(path, arr);
  }
}

export async function pardonIp(uid: string, ip: string) {
  const v = normalizeValue(ip);
  if (isServerOnline(uid)) {
    getOrCreateServer(uid).sendCommand(`pardon-ip ${v}`);
    return;
  }
  const path = resolveSafePath(uid, 'banned-ips.json');
  const arr = await readJsonArray<MinecraftBanEntry>(path);
  const next = arr.filter(
    (e) => (e.ip ?? '').toLowerCase() !== v.toLowerCase() && displayName(e).toLowerCase() !== v.toLowerCase(),
  );
  await writeJsonArray(path, next);
}
