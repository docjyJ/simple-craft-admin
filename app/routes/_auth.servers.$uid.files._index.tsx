import type {Route} from './+types/_auth.servers.$uid.files._index';
import {deletePath, getPath, uploadFiles, extractArchive} from "~/server/file-explorer";
import {ArchiveViewer, DirectoryExplorer, FileEditor} from "~/components/file-explorer";
import {z} from 'zod';
import {deleteSchema, extractSchema, uploadSchema} from "~/components/file-explorer/modals";
import {parseFormData, validationError} from "@rvf/react-router";




const schema = z.discriminatedUnion("type", [deleteSchema, uploadSchema, extractSchema]);

export async function loader({params, request}: Route.LoaderArgs) {
	const url = new URL(request.url);
	const path = url.searchParams.get("path") || "";
	const file = await getPath(params.uid, path);
	return {file};
}

export async function action({request, params}: Route.ActionArgs) {
	const result = await parseFormData(request, schema);
	if (result.error) {
		return validationError(result.error, result.submittedData);
	}

	switch (result.data.type) {
		case "delete":
			await deletePath(params.uid, result.data.path);
			break;
		case "upload":
			await uploadFiles(params.uid, result.data.path, result.data.file);
			break;
		case "extract":
			await extractArchive(params.uid, result.data.path);
			break;
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
