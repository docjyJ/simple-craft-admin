import {readFile, rm, readdir, stat, writeFile, mkdir} from "node:fs/promises";
import {resolve, basename, dirname} from "node:path";
import {serverFolder} from "~/server/minecraft-servers";
import JSZip from "jszip";

type FileEntry = {
	type: "file";
	content: string;
} | {
	type: "folder";
	child: {
		name: string;
		type: "file" | "folder" | "archive";
	}[];
} | {
	type: "archive";
	tree: string[];
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
		const child = entries.map(entry => {
			if (entry.isDirectory()) {
				return {name: entry.name, type: "folder" as const};
			} else if (entry.name.endsWith(".zip")) {
				return {name: entry.name, type: "archive" as const};
			} else {
				return {name: entry.name, type: "file" as const};
			}
		});
		child.sort((a, b) => {
			if (a.type === b.type) return a.name.localeCompare(b.name);
			return a.type === "folder" ? -1 : 1;
		});
		return {type: "folder", child};
	} else if (targetDir.endsWith(".zip")) {
		const buffer = await readFile(targetDir);
		const zip = await JSZip.loadAsync(buffer);
		const tree: string[] = [];
		zip.forEach((relativePath) => {
			tree.push(relativePath);
		});
		return {type: "archive", tree};
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

export async function extractMinecraftServerArchive(
	uid: string,
	zipPaths: string
): Promise<void> {
	if (!zipPaths.endsWith(".zip")) {
		throw new Error("Invalid archive path, must end with .zip");
	}
	const archivePath = resolveSafePath(serverFolder, uid, zipPaths);
	const destDir = resolveSafePath(serverFolder, uid, zipPaths.slice(0, -4));
	const buffer = await readFile(archivePath);
	const zip = await JSZip.loadAsync(buffer);

	for (const entry of Object.values(zip.files)) {
		const outPath = resolve(destDir, entry.name);
		if (entry.dir) {
			await mkdir(outPath, {recursive: true});
		} else {
			await mkdir(dirname(outPath), {recursive: true});
			const content = await entry.async("nodebuffer");
			await writeFile(outPath, content);
		}
	}
}