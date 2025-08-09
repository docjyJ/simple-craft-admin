import type {Route} from './+types/_auth.servers.$uid.files._index';
import {Form, Link, useLocation, useNavigate} from "react-router";
import {
	deletePath,
	getPath,
	uploadFiles,
	extractArchive, type FolderEntry
} from "~/server/file-explorer";
import {
	IconFile,
	IconFolder,
	IconTrash,
	IconDownload,
	IconUpload,
	IconFileZip,
	IconFolderUp
} from "@tabler/icons-react";
import CodeMirror from "@uiw/react-codemirror";
import {
	Stack,
	Text,
	Anchor,
	Breadcrumbs,
	Table,
	ScrollArea,
	Paper,
	Button,
	ActionIcon,
	Modal,
	Group,
	FileInput,
} from "@mantine/core";
import {useState} from "react";

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

const FORBIDDEN_PATHS = ["..", ".", ""];

function urlBuilder({path, download, upload}: { path: string, download?: boolean, upload?: boolean }): string {
	const builder = []
	if (download) builder.push(download);
	if (path) builder.push(`?path=${encodeURIComponent(path)}`);
	if (upload) builder.push('#upload');
	return builder.join('');
}

function useExplorerLocation() {
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const pathArray = (searchParams.get("path") ?? "").split("/").filter(p => !FORBIDDEN_PATHS.includes(p));
	const pathString = pathArray.join("/");
	return {
		pathArray,
		pathString,
		upload: location.hash === "#upload"
	};
}

export default function FileExplorer({loaderData: {file}}: Route.ComponentProps) {
	const {pathArray, pathString} = useExplorerLocation();


	const pathWithRoot = [
		"Root",
		...pathArray
	];

	return (
		<Stack>
			<Group>
				<Paper withBorder style={{flexGrow: 1}}>
					<ScrollArea>
						<Breadcrumbs m="sm" style={{flexWrap: "nowrap"}}>
							{pathWithRoot.map((p, index) => (
								pathWithRoot.length - 1 === index ? (
									<Text key={index}>{p}</Text>
								) : (
									<Anchor
										key={index}
										component={Link}
										to={urlBuilder({path: pathWithRoot.slice(1, index + 1).join("/")})}
									>
										{p}
									</Anchor>
								)
							))}
						</Breadcrumbs>
					</ScrollArea>
				</Paper>
				<Button
					component={Link}
					to={urlBuilder({path: pathString})}
					download reloadDocument
					color="blue"
					aria-label={file.type === "folder" ? "Download current folder" : "Download current file"}
					leftSection={<IconDownload/>}
				>
					Download
				</Button>
				{
					file.type === "folder" ? (
						<Button
							component={Link}
							to={urlBuilder({path: pathString, upload: true})}
							color="green"
							aria-label="Upload file"
							leftSection={<IconUpload/>}
						>
							Upload
						</Button>
					) : (
						<Button
							color="red"
							aria-label="Delete file"
							onClick={() => {
								// TODO setDeleteModal({name: pathArray[pathArray.length - 1], isDir: false, path: pathString});
							}}
							leftSection={<IconTrash/>}
						>
							Delete
						</Button>
					)
				}
			</Group>
			{
				file.type === "folder"
					? <DirectoryExplorer entries={file.entries}/>
					: file.type === "archive"
						? <ArchiveViewer archiveFiles={file.tree}/>
						: <FileEditor fileContent={file.content}/>
			}
		</Stack>
	);
}

type UploadFilesModalProps = {
	opened: boolean;
	closePath: string;
	path: string;
}

function UploadFilesModal({closePath, path, opened}: UploadFilesModalProps) {
	const navigate = useNavigate();
	if (!opened) return null;
	return (
		<Modal
			onClose={() => navigate(closePath)}
			title="Upload file"
			centered opened
		>
			<Form method="POST" encType="multipart/form-data" action={closePath}>
				<input type="hidden" name="path" value={path}/>
				<FileInput
					name="file"
					multiple
					required
					label="Select file(s) to upload"
					placeholder="Choose file(s)"
					accept="*/*"
				/>
				<Group mt="md" justify="flex-end">
					<Button component={Link} to={closePath} variant="default" type="button">Cancel</Button>
					<Button color="green" type="submit" name="type" value="upload">Upload</Button>
				</Group>
			</Form>
		</Modal>
	);
}

type DeleteFileModalProps = {
	path: string;
	deleteModal: { name: string, isDir: boolean } | null;
	onClose: () => void;
};

function DeleteFileModal({deleteModal, onClose, path}: DeleteFileModalProps) {
	if (!deleteModal) return null;
	return (
		<Modal
			onClose={onClose}
			title="Confirm Deletion"
			centered opened>
			{deleteModal && (
				deleteModal.isDir
					? <Text>Are you sure you want to delete entire {deleteModal.name} directory?</Text>
					: <Text>Are you sure you want to delete {deleteModal.name} file?</Text>
			)}
			<Form method="POST" onSubmit={onClose}>
				<input type="hidden" name="type" value="delete"/>
				<input type="hidden" name="path" value={`${path}/${deleteModal.name}`}/>
				<Group mt="md" justify="flex-end">
					<Button variant="default" type="button" onClick={onClose}>Cancel</Button>
					<Button color="red" type="submit" name="type" value="delete">Delete</Button>
				</Group>
			</Form>
		</Modal>
	);
}

type FileEditorProps = {
	fileContent: string;
}

function FileEditor({fileContent}: FileEditorProps) {
	return (
		<CodeMirror
			value={fileContent}
			readOnly={true}
			style={{fontSize: 14}}
		/>
	);
}

type ArchiveViewerProps = {
	archiveFiles: string[];
}

function ArchiveViewer({archiveFiles}: ArchiveViewerProps) {
	return <Stack>{archiveFiles.map((name) => (<Text key={name}>{name}</Text>))}</Stack>;
}

type DirectoryExplorerProps = {
	entries: FolderEntry[];
};

function DirectoryExplorer({entries}: DirectoryExplorerProps) {
	const {pathArray, pathString, upload} = useExplorerLocation();
	const navigate = useNavigate();
	const [deleteModal, setDeleteModal] = useState<{ name: string, isDir: boolean, path: string } | null>(null);
	return (
		<>
			<Table.ScrollContainer minWidth={800} type="native">
				<Table highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Name</Table.Th>
							<Table.Th>Type</Table.Th>
							<Table.Th>Actions</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entries.map((entry) => {
							const filePath = [...pathArray, entry.name].join("/");
							return (
								<Table.Tr
									key={entry.name}
									onClick={() => navigate(urlBuilder({path: filePath}))}
									style={{cursor: "pointer"}}
								>
									<Table.Td>
										{entry.type === "folder" ? <IconFolder/> : entry.type === "archive" ? <IconFileZip/> :
											<IconFile/>} {entry.name}
									</Table.Td>
									<Table.Td>
										{entry.type === "folder" ? "Folder" : entry.type === "archive" ? "Archive" : "File"}
									</Table.Td>
									<Table.Td>
										<Group>
											<ActionIcon
												color="red"
												type="button"
												aria-label="Delete file"
												onClick={e => {
													e.stopPropagation();
													setDeleteModal({name: entry.name, isDir: entry.type === "folder", path: filePath});
												}}
											>
												<IconTrash/>
											</ActionIcon>
											<ActionIcon
												component={Link}
												to={urlBuilder({path: filePath, download: true})}
												download reloadDocument
												color="blue"
												type="button"
												aria-label={entry.type === "folder" ? "Download folder" : "Download file"}
												onClick={e => e.stopPropagation()}
											>
												<IconDownload/>
											</ActionIcon>
											{
												entry.type === "archive" && (
													<Form method="POST" action={urlBuilder({path: pathString})}>
														<input type="hidden" name="path" value={filePath}/>
														<ActionIcon
															color="green"
															type="submit"
															aria-label="Extract archive"
															name="type"
															value="extract"
															onClick={e => e.stopPropagation()}

														><IconFolderUp/></ActionIcon>
													</Form>
												)
											}
										</Group>
									</Table.Td>
								</Table.Tr>
							);
						})}
					</Table.Tbody>
				</Table>
			</Table.ScrollContainer>
			<DeleteFileModal path={pathString} deleteModal={deleteModal} onClose={() => setDeleteModal(null)}/>
			<UploadFilesModal opened={upload} path={pathString}
												closePath={urlBuilder({path: pathString})}/>
		</>
	);
}