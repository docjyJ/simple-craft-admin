import type {Route} from './+types/_auth.servers.$uid.files.download';
import {downloadServerFile} from "~/server/file-explorer";

export async function loader({request, params}: Route.LoaderArgs) {
	const url = new URL(request.url);
	const path = url.searchParams.get("path");
	if (!path) {
		return new Response("Chemin de fichier manquant", {status: 400});
	}
	const {content, name, contentType} = await downloadServerFile(params.uid, path);
	return new Response(content, {
		headers: {
			"Content-Type": contentType,
			"Content-Disposition": `attachment; filename="${name}"`
		}
	});
}