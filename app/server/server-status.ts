import * as net from "node:net"
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";

// TODO add cache

export type ServerStatus = {
	version: string,
	max_players: number,
	online_players: number,
	players: [{
		name: string,
		id: string
	}[]],
	motd: string,
	icon?: string,
}
export type ServerProperties = {
	motd?: string;
	max_players?: number;
	server_port?: number;
}


export async function getServerStatus(
	port: number,
) {
	return new Promise((resolve) => {
		const socket = new net.Socket();

		socket.on('connect', () => {
			const handshake = Buffer.from([
				0x00, // Packet ID for Handshake
				0x00, // Protocol version (0 for legacy)
				0x00, // Server address length
				0x00, // Server address
				port >> 8, port & 0xFF, // Port number
				0x01  // Next state (1 for status)
			]);
			socket.write(handshake);
			socket.end();
		});

		socket.on('data', (data: any) => {
			try {
				const response = JSON.parse(data.toString());
				resolve(response as ServerStatus);
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
	return readFile(filePath, "utf8").then(
		data => {
			const properties: ServerProperties = {};
			data.split("\n").forEach(line => {
				const data = line.split("=");
				if (data.length === 2) {
					const key = data[0].trim();
					const value = data[1].trim();
					if (key === "motd") {
						properties.motd = value;
					} else if (key === "max-players") {
						const valueInt = parseInt(value, 10);
						if (!isNaN(valueInt)) {
							properties.max_players = valueInt;
						}
					} else if (key === "server-port") {
						const valueInt = parseInt(value, 10);
						if (!isNaN(valueInt)) {
							properties.server_port = valueInt;
						}
					}
				}
			});
			return properties;
		}
	).catch(
		error => {
			console.error(`Error reading server properties from ${filePath}:`, error);
			return {} as ServerProperties;
		}
	)
}


export async function getServerIcon(server_folder: string) {
	const filePath = resolve(server_folder, "server-icon.png");
	return readFile(filePath, "base64").then(
		data => {
			return `data:image/png;base64,${data}`;
		}
	).catch(
		error => {
			console.error(`Error reading server icon from ${filePath}:`, error);
			return undefined
		}
	)
}