import {readFile, rm, readdir, stat, writeFile} from "node:fs/promises";
import {resolve, basename} from "node:path";
import {serverFolder} from "~/server/minecraft-servers";
import JSZip from "jszip";

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

const FORBIDDEN_PATHS = ["..", ".", ""];


export function resolveSafePath(root: string, uid: string, paths: string): string {
	return resolve(root, uid, ...paths.split("/").filter(p => !FORBIDDEN_PATHS.includes(p)));
}

export async function getMinecraftServerFiles(uid: string, relPath: string): Promise<FileEntry> {
	const targetDir = resolveSafePath(serverFolder, uid, relPath);
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

export async function deleteMinecraftServerFile(uid: string, relPath: string): Promise<void> {
	const targetPath = resolveSafePath(serverFolder, uid, relPath);
	await rm(targetPath, {recursive: true, force: true});
}

export async function downloadServerFile(uid: string, relPath: string): Promise<{
	content: Buffer,
	name: string,
	contentType: string
}> {
	const targetPath = resolveSafePath(serverFolder, uid, relPath);
	const s = await stat(targetPath);
	if (s.isDirectory()) {
		const zip = new JSZip();

		async function addDirToZip(dir: string, zipFolder: JSZip) {
			const entries = await readdir(dir, {withFileTypes: true});
			for (const entry of entries) {
				const entryPath = `${dir}/${entry.name}`;
				if (entry.isDirectory()) {
					await addDirToZip(entryPath, zipFolder.folder(entry.name)!);
				} else {
					const fileData = await readFile(entryPath);
					zipFolder.file(entry.name, fileData);
				}
			}
		}

		await addDirToZip(targetPath, zip);
		const content = await zip.generateAsync({type: "nodebuffer"});
		return {
			content,
			name: basename(targetPath) + ".zip",
			contentType: "application/zip"
		};
	} else {
		const content = await readFile(targetPath);
		return {
			content,
			name: basename(targetPath),
			contentType: "application/octet-stream"
		};
	}
}

export async function uploadMinecraftServerFiles(
	uid: string,
	relPath: string,
	files: { name: string, buffer: Buffer }[]
): Promise<void> {
	const targetDir = resolveSafePath(serverFolder, uid, relPath);
	for (const file of files) {
		const targetFile = resolve(targetDir, file.name);
		await writeFile(targetFile, file.buffer);
	}
}