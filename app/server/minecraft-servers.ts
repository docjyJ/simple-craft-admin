import {spawn} from "node:child_process";
import {readdir, readFile} from "node:fs/promises";
import {
	editSacProperties,
	editServerProperties,
	getSacProperties,
	getServerIcon,
	getServerProperties,
	getServerStatus,
} from "~/server/server-status";
import {isValidUid, resolveSafePath, root} from "~/server/path-validation";


export type MinecraftServer = {
	uid: string;
	server_data: ServerData;
}

export type ServerData = {
	is_online: boolean,
	motd: string,
	server_port: number,
	max_players: number,
	online_players: number,
	server_icon: string,
	server_version: string,
	name: string
	jar_url: string;
} | {
	is_online: boolean,
	motd: string,
	server_port: number,
	max_players: number,
	online_players?: undefined,
	server_icon: string,
	server_version?: undefined,
	name: string
	jar_url: string;
};
const serverProcesses: Map<string, import("child_process").ChildProcess> = new Map();


export async function listMinecraftServers(): Promise<string[]> {
	const dirs = await readdir(root, {withFileTypes: true});
	return dirs.filter(d => d.isDirectory()).map(d => d.name).filter(isValidUid)
}

export async function fullListMinecraftServers(): Promise<MinecraftServer[]> {
	const servers: MinecraftServer[] = [];
	for (const uid of await listMinecraftServers()) {
		const serverData = await getServerData(uid);
		servers.push({uid, server_data: serverData});
	}
	return servers;
}

export async function getServerData(uid: string): Promise<ServerData> {
	const fullPath = resolveSafePath(uid, "");
	const serverProperties = await getServerProperties(fullPath);
	const sacProperties = await getSacProperties(fullPath);
	const serverStatus = isRunning(uid) ? await getServerStatus(serverProperties.server_port) : null
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
		}
	} else
		return {
			is_online: false,
			motd: serverProperties.motd,
			max_players: serverProperties.max_players,
			server_icon: await getServerIcon(fullPath),
			name: sacProperties.name,
			server_port: serverProperties.server_port
		}
}


export function startMinecraftServer(uid: string) {
	const fullPath = resolveSafePath(uid, "");
	const javaArgs = ["-Xmx1024M", "-Xms1024M", "-jar", "server.jar", "nogui"];
	const proc = spawn("java", javaArgs, {
		cwd: fullPath,
		detached: true,
		stdio: ["pipe", "ignore", "ignore"]
	});

	if (typeof proc.pid === "number") {
		serverProcesses.set(uid, proc);
	} else {
		throw new Error("Failed to start Minecraft server process. PID is not a number.");
	}

	proc.unref();
}


export function sendCommandToServer(uid: string, command: string) {
	const proc = serverProcesses.get(uid);
	if (proc !== undefined && proc.stdin !== null) {
		try {
			proc.stdin.write(`${command}\n`);
		} catch {
		}
	}
}


export function isRunning(uid: string): boolean {
	const proc = serverProcesses.get(uid);
	if (proc === undefined) {
		return false;
	} else if (proc.exitCode !== null) {
		serverProcesses.delete(uid);
		return false;
	} else return true;
}


export function forceKill(uid: string): boolean {
	const proc = serverProcesses.get(uid);
	if (proc !== undefined) {
		try {
			proc.kill("SIGKILL");
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

export async function getMinecraftServerLog(uid: string, clientLines: number): Promise<string[]> {
	const fullPath = resolveSafePath(uid, "logs/latest.log");
	const content = await readFile(fullPath, "utf-8");
	const logLines = content.split("\n");
	if (logLines[logLines.length - 1] === "") {
		logLines.pop();
	}
	if (clientLines <= 0) return logLines;
	if (clientLines >= logLines.length) return [];
	return logLines.slice(clientLines);
}


export async function updateConfig(uid: string, {name, server_port}: {
	name: string,
	server_port: number
}): Promise<void> {
	const fullPath = resolveSafePath(uid, "");
	await editServerProperties(fullPath, {
		server_port
	})
	await editSacProperties(fullPath, {
		name: name.trim(),
	})
}

export async function updateJar(uid: string, jarUrl: string): Promise<void> {
	const fullPath = resolveSafePath(uid, "");
	await editServerProperties(fullPath, {
		jar_url: jarUrl
	});
	// download the jar file from the URL and save it to the server directory as server.jar
	const jarPath = resolveSafePath(uid, "server.jar");
	const response = await fetch(jarUrl);
	if (!response.ok) {
		throw new Error(`Failed to download jar file from ${jarUrl}: ${response.statusText}`);
	}
	const buffer = await response.buffer();
	await writeFile(jarPath, buffer);
}