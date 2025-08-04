import {stat, readdir, readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {serverFolder} from "~/server/minecraft-servers";

type FileEntry = {
	type: "file";
	content: string;
} | {
	type: "folder";
	child: {
		name: string;
		isDir: boolean;
	}[];
};


export async function getMinecraftServerFiles(uid: string, relPath: string): Promise<FileEntry> {
	const targetDir = resolve(serverFolder, uid, relPath);
	const s = await stat(targetDir);

	if (s.isDirectory()) {
		const entries = await readdir(targetDir, {withFileTypes: true});
		const child = entries.map(entry => ({
			name: entry.name,
			isDir: entry.isDirectory(),
		}));
		child.sort((a, b) => {
			if (a.isDir === b.isDir) return a.name.localeCompare(b.name);
			return a.isDir ? -1 : 1;
		});
		return {type: "folder", child};
	} else {
		const content = await readFile(targetDir, "utf-8");
		return {type: "file", content};
	}
}