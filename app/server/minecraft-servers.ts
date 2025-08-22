import { spawn } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'crypto';
import {
  editSacProperties,
  editServerProperties,
  getSacProperties,
  getServerIcon,
  getServerProperties,
  getServerStatus,
} from '~/server/server-status';
import { isValidUid, resolveSafePath, root } from '~/server/path-validation';

const serverProcesses: Map<string, import('child_process').ChildProcess> = new Map();

export async function listMinecraftServers() {
  const dirs = await readdir(root, { withFileTypes: true });
  return dirs
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter(isValidUid);
}

export async function fullListMinecraftServers() {
  const servers = [];
  for (const uid of await listMinecraftServers()) {
    const serverData = await getServerData(uid);
    servers.push({ uid, server_data: serverData });
  }
  return servers;
}

export async function getServerData(uid: string) {
  const fullPath = resolveSafePath(uid, '');
  const serverProperties = await getServerProperties(fullPath);
  const sacProperties = await getSacProperties(fullPath);
  const serverStatus = isRunning(uid) ? await getServerStatus(serverProperties.server_port) : null;
  if (serverStatus) {
    return {
      is_online: true,
      motd: serverStatus.motd,
      max_players: serverStatus.max_players,
      online_players: serverStatus.online_players,
      server_icon: serverStatus.icon,
      server_version: serverStatus.version,
      name: sacProperties.name,
      server_port: serverProperties.server_port,
      jar_url: sacProperties.jar_url,
    };
  } else
    return {
      is_online: false,
      motd: serverProperties.motd,
      max_players: serverProperties.max_players,
      server_icon: await getServerIcon(fullPath),
      name: sacProperties.name,
      server_port: serverProperties.server_port,
      jar_url: sacProperties.jar_url,
    };
}

export function startMinecraftServer(uid: string) {
  const fullPath = resolveSafePath(uid, '');
  const javaArgs = ['-Xmx1024M', '-Xms1024M', '-jar', 'server.jar', 'nogui'];
  const proc = spawn('java', javaArgs, {
    cwd: fullPath,
    detached: true,
    stdio: ['pipe', 'ignore', 'ignore'],
  });

  if (typeof proc.pid === 'number') {
    serverProcesses.set(uid, proc);
  } else {
    throw new Error('Failed to start Minecraft server process. PID is not a number.');
  }

  proc.unref();
}

export function sendCommandToServer(uid: string, command: string) {
  const proc = serverProcesses.get(uid);
  if (proc !== undefined && proc.stdin !== null) {
    try {
      proc.stdin.write(`${command}\n`);
    } catch {}
  }
}

export function isRunning(uid: string) {
  const proc = serverProcesses.get(uid);
  if (proc === undefined) {
    return false;
  } else if (proc.exitCode !== null) {
    serverProcesses.delete(uid);
    return false;
  } else return true;
}

export function forceKill(uid: string) {
  const proc = serverProcesses.get(uid);
  if (proc !== undefined) {
    try {
      proc.kill('SIGKILL');
      serverProcesses.delete(uid);
      return true;
    } catch (e) {
      console.error(`Failed to kill server process for ${uid}:`, e);
      return false;
    }
  } else {
    return true;
  }
}

export async function getMinecraftServerLog(uid: string, clientLines: number) {
  const fullPath = resolveSafePath(uid, 'logs/latest.log');
  const content = await readFile(fullPath, 'utf-8');
  const logLines = content.split('\n');
  if (logLines[logLines.length - 1] === '') {
    logLines.pop();
  }
  if (clientLines <= 0) return logLines;
  if (clientLines >= logLines.length) return [];
  return logLines.slice(clientLines);
}

export async function updateConfig(
  uid: string,
  {
    name,
    server_port,
    jar_url,
  }: {
    name: string;
    server_port: number;
    jar_url: string;
  },
) {
  const fullPath = resolveSafePath(uid, '');
  await editServerProperties(fullPath, {
    server_port,
  });
  await editSacProperties(fullPath, {
    name: name.trim(),
    jar_url: jar_url,
  });
}

// TODO: Add button in manage view to update jar file
export async function updateJar(uid: string) {
  const fullPath = resolveSafePath(uid, '');
  const { jar_url } = await getSacProperties(fullPath);
  const jarPath = resolveSafePath(uid, 'server.jar');
  const response = await fetch(jar_url);
  if (!response.ok) {
    throw new Error(`Failed to download jar file from ${jar_url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await writeFile(jarPath, buffer);
}

export async function createMinecraftServer({ name }: { name: string }) {
  const uid = randomUUID();
  const serverPath = resolveSafePath(uid, '');
  await mkdir(serverPath, { recursive: true });
  // Fichier sac.properties minimal
  await writeFile(resolveSafePath(uid, 'sac.properties'), `name=${name}\njar_url=\n`);
  // Fichier server.properties minimal
  await writeFile(
    resolveSafePath(uid, 'server.properties'),
    `motd=${name}\nmax-players=20\nserver-port=25565\n`,
  );
  return uid;
}
