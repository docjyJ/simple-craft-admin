import * as fs from "fs";
import * as path from "path";
import {spawn} from "child_process";
import {getServerIcon, getServerProperties} from "~/server/server-status";


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

export const serverFolder = "./minecraft/servers"

export function listMinecraftServers(): string[] {
	//list folders in serverFolder

	return fs.readdirSync(path.resolve(serverFolder), {withFileTypes: true})
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name)
}

export async function fullListMinecraftServers(): Promise<MinecraftServer[]> {
	const servers: MinecraftServer[] = [];
	for (const uid of listMinecraftServers()) {
		const serverData = await getServerData(uid);
		const isOnline = isRunning(uid);
		servers.push({uid, server_data: serverData, is_online: isOnline});
	}
	return servers;
}

export async function getServerData(uid: string) {

	const serverPath = path.resolve(serverFolder, uid);

	const serverProperties = await getServerProperties(serverPath)
	// TODO const status = await getServerStatus(serverProperties.server_port)

	const serverIcon = await getServerIcon(serverPath);


	return {
		motd: serverProperties.motd,
		max_players: serverProperties.max_players,
		server_icon: serverIcon,
	} as ServerData;
}


export function startMinecraftServer(uid: string) {
	const serverPath = path.resolve(serverFolder, uid);
	const javaArgs = ["-Xmx1024M", "-Xms1024M", "-jar", "server.jar", "nogui"];
	const proc = spawn("java", javaArgs, {
		cwd: serverPath,
		detached: true,
		stdio: ["pipe", "ignore", "ignore"]
	});

	if (typeof proc.pid === "number") {
		serverProcesses.set(uid, proc);
	} else {
		throw new Error("Impossible de récupérer le PID du processus Minecraft.");
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

export function getMinecraftServerLog(uid: string): string | undefined {
	const logPath = path.resolve(serverFolder, uid, "logs", "latest.log");
	if (!fs.existsSync(logPath)) {
		return undefined;
	}
	return fs.readFileSync(logPath, "utf-8");
}
