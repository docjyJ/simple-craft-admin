import {readFile, rm, readdir, stat, writeFile} from "node:fs/promises";
import {getRelativePath, resolveSafePath} from "~/server/path-validation";
import {zipTree, unzipFile, zipFile} from "~/server/zip-managment";

export type FileType = "file" | "folder" | "archive";

export type FolderEntry = {
	name: string;
	type: FileType;
}

export type PathContent = {
	type: "file";
	content: string;
} | {
	type: "folder";
	entries: FolderEntry[];
} | {
	type: "archive";
	tree: string[];
};

export type DownloadPath = {
	content: Buffer;
	name: string;
	contentType: "application/zip" | "application/octet-stream";
}


export async function getPath(uid: string, inputPath: string): Promise<PathContent> {
	const fullPath = resolveSafePath(uid, inputPath);
	const s = await stat(fullPath);

	if (s.isDirectory()) {
		const entries = (await readdir(fullPath, {withFileTypes: true}))
			.map(entry => ({
				name: entry.name,
				type: entry.isDirectory() ? "folder" : entry.name.endsWith(".zip") ? "archive" : "file"
			} as FolderEntry))
			.sort((a, b) => {
				return a.type === b.type ? a.name.localeCompare(b.name) : a.type === "folder" ? -1 : 1;
			});
		return {type: "folder", entries};
	} else if (fullPath.endsWith(".zip")) {
		const tree = await zipTree(fullPath);
		return {type: "archive", tree};
	} else {
		const content = await readFile(fullPath, "utf-8");
		return {type: "file", content};
	}
}

export async function deletePath(uid: string, inputPath: string): Promise<void> {
	const fullPath = resolveSafePath(uid, inputPath);
	const relativePath = getRelativePath(uid, fullPath);
	if (relativePath === "/") {
		throw new Error("Cannot delete the root directory of a server");
	}
	await rm(fullPath, {recursive: true, force: true});
}

export async function downloadPath(uid: string, relPath: string): Promise<DownloadPath> {
	const fullPath = resolveSafePath(uid, relPath);
	const relativePath = getRelativePath(uid, fullPath);
	const fileName = relativePath === "/" ? "Root" : relativePath.split("/").pop() || "Unknown";
	const s = await stat(fullPath);
	if (s.isDirectory()) {
		const content = await zipFile(fullPath);
		return {
			content,
			name: `${fileName}.zip`,
			contentType: "application/zip"
		};
	} else {
		const content = await readFile(fullPath);
		return {
			content,
			name: fileName,
			contentType: "application/octet-stream"
		};
	}
}

export async function uploadFiles(uid: string, targetPath: string, files: File[]): Promise<void> {
	const fullPath = resolveSafePath(uid, targetPath);
	for (const file of files) {
		await writeFile(`${fullPath}/${file.name}`, Buffer.from(await file.arrayBuffer()));
	}
}

export async function extractArchive(uid: string, targetPath: string): Promise<void> {
	const fullPath = resolveSafePath(uid, targetPath);
	if (!fullPath.endsWith(".zip")) {
		throw new Error("Invalid archive path, must end with .zip");
	}
	const buffer = await readFile(fullPath);
	await unzipFile(buffer, fullPath.slice(0, -4));
}