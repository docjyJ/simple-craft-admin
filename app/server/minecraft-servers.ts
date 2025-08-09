import {spawn} from "node:child_process";
import {readdir, readFile} from "node:fs/promises";
import {getServerIcon, getServerProperties} from "~/server/server-status";
import {getRootPaths, isValidUid, resolveSafePath} from "~/server/path-validation";


export type MinecraftServer = {
	uid: string;
	server_data: ServerData;
	is_online: boolean;
}

export type ServerData = {
	motd?: string;
	online_players?: number;
	players?: string[];
	max_players?: number;
	server_icon?: string;
	server_version?: string;
};
const serverProcesses: Map<string, import("child_process").ChildProcess> = new Map();


export async function listMinecraftServers(): Promise<string[]> {
	const dirs = await readdir(getRootPaths(), {withFileTypes: true});
	return dirs.filter(d => d.isDirectory()).map(d => d.name).filter(isValidUid)
}

export async function fullListMinecraftServers(): Promise<MinecraftServer[]> {
	const servers: MinecraftServer[] = [];
	for (const uid of await listMinecraftServers()) {
		const serverData = await getServerData(uid);
		const isOnline = isRunning(uid);
		servers.push({uid, server_data: serverData, is_online: isOnline});
	}
	return servers;
}

export async function getServerData(uid: string) {

	const {fullPath} = resolveSafePath(uid, "");

	const serverProperties = await getServerProperties(fullPath)
	// TODO const status = await getServerStatus(serverProperties.server_port)

	const serverIcon = await getServerIcon(fullPath);


	return {
		motd: serverProperties.motd,
		max_players: serverProperties.max_players,
		server_icon: serverIcon,
	} as ServerData;
}


export function startMinecraftServer(uid: string) {
	const {fullPath} = resolveSafePath(uid, "");
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
			proc.stdin.write(command + "\n");
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

export async function getMinecraftServerLog(uid: string): Promise<string> {
	const {fullPath} = resolveSafePath(uid, "logs/latest.log");
	return await readFile(fullPath, "utf-8");
}
