import type {Route} from './+types/_auth.servers.$uid.files._index';
import {deletePath, getPath, uploadFiles, extractArchive} from "~/server/file-explorer";
import {ArchiveViewer, DirectoryExplorer, FileEditor} from "~/components/file-explorer";

export async function loader({params, request}: Route.LoaderArgs) {
	const url = new URL(request.url);
	const path = url.searchParams.get("path") || "";
	const file = await getPath(params.uid, path);
	return {file};
}

export async function action({request, params}: Route.ActionArgs) {
	const formData = await request.formData();
	const type = formData.get("type");
	const path = formData.get("path");

	if (type === "delete" && typeof path === "string" && path.trim() !== "") {
		await deletePath(params.uid, path);
		return null;
	}

	if (type === "upload" && typeof path === "string") {
		const files = formData.getAll("file").filter((entry => entry instanceof File)) as File[];
		await uploadFiles(params.uid, path, files);
		return null;
	}

	if (type === "extract" && typeof path === "string") {
		await extractArchive(params.uid, path);
		return null;
	}

	return null;
}


export default function FileExplorer({loaderData: {file}}: Route.ComponentProps) {
	switch (file.type) {
		case "folder":
			return <DirectoryExplorer entries={file.entries}/>;
		case "archive":
			return <ArchiveViewer archiveFiles={file.tree}/>;
		case "file":
			return <FileEditor fileContent={file.content}/>;
	}
}
