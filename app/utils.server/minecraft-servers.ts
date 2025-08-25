import { readdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'crypto';
import { isValidUid, resolveSafePath, root } from '~/utils.server/path-validation';
import { getOrCreateServer } from '~/utils.server/server-minecraft';
import { getProperties } from 'properties-file';
import type { SacProperties, ServerProperties, ServerStatus } from '~/type';
import { Socket } from 'node:net';
import pack_jpg from '~/assets/pack_png';
import { PropertiesEditor } from 'properties-file/editor';

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
    const server = getOrCreateServer(uid);
    const serverData = await server.getServerData();
    servers.push({ uid, server_data: serverData });
  }
  return servers;
}

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
  const instance = getOrCreateServer(uid);
  await instance.init({ name });
  return uid;
}

export function defaultIfFileNotExist<T>(defaultValue: T) {
  return function (e: { code?: any }): T {
    if (e.code === 'ENOENT') {
      return defaultValue;
    }
    throw e;
  };
}

export async function getServerStatus(port: number): Promise<ServerStatus | null> {
  return new Promise((resolve) => {
    const socket = new Socket();

    socket.on('connect', () => {
      const handshake = Buffer.from([
        0x0f, // Handshake length
        0x00, // Packet ID for Handshake
        0x04, // Protocol version (0 for legacy)
        0x09, // Server address length
        0x6c,
        0x6f,
        0x63,
        0x61,
        0x6c,
        0x68,
        0x6f,
        0x73,
        0x74, // Server address (localhost)
        (port >> 8) & 0xff,
        port & 0xff, // Port number
        0x01, // Next state
        0x01, // Status Request length
        0x00, // Packet ID for Status Request
      ]);
      socket.write(handshake);
      socket.end();
    });

    socket.on('data', (data: Buffer) => {
      const brut = data.toString('utf8');
      const json = brut.slice(brut.indexOf('{'), brut.lastIndexOf('}') + 1);
      try {
        const obj = JSON.parse(json);
        resolve({
          version: obj.version.name as string,
          max_players: obj.players.max as number,
          online_players: obj.players.online as number,
          players: obj.players.sample as { name: string; id: string }[],
          motd: obj.description as string,
          icon: obj.favicon as string,
        });
      } catch (e) {
        resolve(null);
      }
    });

    socket.on('error', () => resolve(null));
    socket.on('timeout', () => resolve(null));

    socket.connect(port, 'localhost');
  });
}

export async function getServerProperties(serverPropertiesFile: string) {
  const properties: ServerProperties = {
    motd: 'A Minecraft Server',
    max_players: 20,
    server_port: 25565,
  };
  return readFile(serverPropertiesFile, 'utf8')
    .then(getProperties)
    .then((data) => {
      if (data['motd']) {
        properties.motd = data['motd'];
      }
      if (data['max-players']) {
        const valueInt = parseInt(data['max-players'], 10);
        if (!isNaN(valueInt)) {
          properties.max_players = valueInt;
        }
      }
      if (data['server-port']) {
        const valueInt = parseInt(data['server-port'], 10);
        if (!isNaN(valueInt)) {
          properties.server_port = valueInt;
        }
      }
      return properties;
    })
    .catch(defaultIfFileNotExist(properties));
}

export async function getServerIcon(serverIconFile: string) {
  return readFile(serverIconFile, 'base64')
    .then((data) => `data:image/png;base64,${data}`)
    .catch(defaultIfFileNotExist(pack_jpg));
}

export async function getSacProperties(sacPropertiesFile: string) {
  const properties: SacProperties = {
    name: 'Unknown Server',
    jar_url: '',
  };
  return readFile(sacPropertiesFile, 'utf8')
    .then(getProperties)
    .then((data) => {
      if (data['name']) {
        properties.name = data['name'];
      }
      if (data['jar-url']) {
        properties.jar_url = data['jar-url'];
      }
      return properties;
    })
    .catch(defaultIfFileNotExist(properties));
}

export async function editServerProperties(serverPropertiesFile: string, properties: Partial<ServerProperties>) {
  return readFile(serverPropertiesFile, 'utf8')
    .catch(defaultIfFileNotExist(''))
    .then((data) => new PropertiesEditor(data))
    .then((editor) => {
      if (properties.motd !== undefined) {
        editor.upsert('motd', properties.motd);
      }
      if (properties.max_players !== undefined) {
        editor.upsert('max-players', properties.max_players.toString());
      }
      if (properties.server_port !== undefined) {
        editor.upsert('server-port', properties.server_port.toString());
      }
      return editor.format();
    })
    .then((formattedData) => writeFile(serverPropertiesFile, formattedData, 'utf8'));
}

export async function editSacProperties(sacPropertiesFile: string, properties: Partial<SacProperties>) {
  return readFile(sacPropertiesFile, 'utf8')
    .catch(defaultIfFileNotExist(''))
    .then((data) => new PropertiesEditor(data))
    .then((editor) => {
      if (properties.name !== undefined) {
        editor.upsert('name', properties.name);
      }
      if (properties.jar_url !== undefined) {
        editor.upsert('jar-url', properties.jar_url);
      }
      return editor.format();
    })
    .then((formattedData) => writeFile(sacPropertiesFile, formattedData, 'utf8'));
}
