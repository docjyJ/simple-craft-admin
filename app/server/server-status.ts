import * as net from "node:net"
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import pack_jpg from "~/assets/pack_png";
import {getProperties} from "properties-file";

export type ServerStatus = {
	version: string,
	max_players: number,
	online_players: number,
	players: {
		name: string,
		id: string
	}[],
	motd: string,
	icon: string,
}
export type ServerProperties = {
	motd: string;
	max_players: number;
	server_port: number;
}


export async function getServerStatus(
	port: number,
): Promise<ServerStatus | null> {
	return new Promise((resolve) => {
		const socket = new net.Socket();

		socket.on('connect', () => {
			const handshake = Buffer.from([
				0x0F, // Handshake length
				0x00, // Packet ID for Handshake
				0x04, // Protocol version (0 for legacy)
				0x09, // Server address length
				0x6C, 0x6F, 0x63, 0x61, 0x6C, 0x68, 0x6F, 0x73, 0x74, // Server address (localhost)
				(port >> 8) & 0xFF, port & 0xFF, // Port number
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
				console.log(obj);
				resolve({
					version: obj.version.name as string,
					max_players: obj.players.max as number,
					online_players: obj.players.online as number,
					players: obj.players.sample as { name: string, id: string }[],
					motd: obj.description as string,
					icon: obj.favicon as string,
				});
			} catch (e) {
				resolve(null);
			}
		});

		socket.on('error', () => resolve(null));
		socket.on('timeout', () => resolve(null));

		socket.connect(port, "localhost");
	});
}


export async function getServerProperties(server_folder: string) {
	const filePath = resolve(server_folder, "server.properties");
	const properties: ServerProperties = {
		motd: "A Minecraft Server",
		max_players: 20,
		server_port: 25565,
	};
	return readFile(filePath, "utf8").then(getProperties).then(
		data => {
			if (data    ["motd"]) {
				properties.motd = data["motd"];
			}
			if (data["max-players"]) {
				const valueInt = parseInt(data["max-players"], 10);
				if (!isNaN(valueInt)) {
					properties.max_players = valueInt;
				}
			}
			if (data["server-port"]) {
				const valueInt = parseInt(data["server-port"], 10);
				if (!isNaN(valueInt)) {
					properties.server_port = valueInt;
				}
			}
			return properties;
		}
	).catch(e => {
		console.error("Error reading server.properties:", e);
		return properties;
	})
}

export async function getServerIcon(server_folder: string) {
	const filePath = resolve(server_folder, "server-icon.png");
	return readFile(filePath, "base64")
		.then(data => `data:image/png;base64,${data}`)
		.catch(() => pack_jpg)
}