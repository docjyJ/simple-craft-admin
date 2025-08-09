import type {Route} from './+types/_auth.servers.$uid.files._index';
import {Form, Link, type Path, useLocation, useNavigate} from "react-router";
import {
	deletePath,
	getPath,
	uploadFiles,
	extractArchive
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
	FileInput
} from "@mantine/core";
import {useState} from "react";

export async function loader({params, request}: Route.LoaderArgs) {
	const url = new URL(request.url);
	const path = url.searchParams.get("path") || "";
	const files = await getPath(params.uid, path);
	return {files};
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

function urlBuilder({path, download, upload}: { path: string, download?: boolean, upload?: boolean }): Partial<Path> {
	const out: Partial<Path> = {};
	if (download) out.pathname = 'download';
	if (path) out.search = `?path=${encodeURIComponent(path)}`;
	if (upload) out.hash = '#upload';

	return out
}

export default function FileExplorer({loaderData: {files}}: Route.ComponentProps) {
	const location = useLocation();
	const navigate = useNavigate();
	const searchParms = new URLSearchParams(location.search);
	const [deleteModal, setDeleteModal] = useState<{ name: string, isDir: boolean, path: string } | null>(null);


	const pathArray = (searchParms.get("path") ?? "").split("/").filter(p => !FORBIDDEN_PATHS.includes(p));
	const pathString = pathArray.join("/");
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
					aria-label={files.type === "folder" ? "Download current folder" : "Download current file"}
					leftSection={<IconDownload/>}
				>
					Download
				</Button>
				{
					files.type === "folder" ? (
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
								setDeleteModal({name: pathArray[pathArray.length - 1], isDir: false, path: pathString});
							}}
							leftSection={<IconTrash/>}
						>
							Delete
						</Button>
					)
				}
			</Group>
			{
				files.type === "folder" ? (
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
								{files.entries.map((file) => {
									const filePath = [...pathArray, file.name].join("/");
									return (
										<Table.Tr
											key={file.name}
											onClick={() => navigate(urlBuilder({path: filePath}))}
											style={{cursor: "pointer"}}
										>
											<Table.Td>
												{file.type === "folder" ? <IconFolder/> : file.type === "archive" ? <IconFileZip/> :
													<IconFile/>} {file.name}
											</Table.Td>
											<Table.Td>
												{file.type === "folder" ? "Folder" : file.type === "archive" ? "Archive" : "File"}
											</Table.Td>
											<Table.Td>
												<Group>
													<ActionIcon
														color="red"
														type="button"
														aria-label="Delete file"
														onClick={e => {
															e.stopPropagation();
															setDeleteModal({name: file.name, isDir: file.type === "folder", path: filePath});
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
														aria-label={file.type === "folder" ? "Download folder" : "Download file"}
														onClick={e => e.stopPropagation()}
													>
														<IconDownload/>
													</ActionIcon>
													{
														file.type === "archive" && (
															<Form method="POST">
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
				) : files.type === "archive" ? (
					<Stack>{files.tree.map((name) => (<Text key={name}>{name}</Text>))}</Stack>
				) : (
					<CodeMirror
						value={files.content}
						readOnly={true}
						style={{fontSize: 14}}
					/>
				)
			}
			<Modal
				opened={deleteModal !== null}
				onClose={() => setDeleteModal(null)}
				title="Confirm Deletion"
				centered
			>
				{deleteModal && (
					deleteModal.isDir
						? <Text>Are you sure you want to delete entire {deleteModal.name} directory?</Text>
						: <Text>Are you sure you want to delete {deleteModal.name} file?</Text>
				)}
				<Form method="POST" onSubmit={() => setDeleteModal(null)}>
					<input type="hidden" name="type" value="delete"/>
					<input type="hidden" name="path" value={deleteModal?.path ?? ""}/>
					<Group mt="md" justify="flex-end">
						<Button variant="default" type="button" onClick={() => setDeleteModal(null)}>Cancel</Button>
						<Button color="red" type="submit" name="type" value="delete">Delete</Button>
					</Group>
				</Form>
			</Modal>
			<Modal
				opened={location.hash === "#upload"}
				onClose={() => navigate(urlBuilder({path: pathString}))}
				title="Upload file"
				centered
			>
				<Form method="POST" encType="multipart/form-data" onSubmit={() => navigate(urlBuilder({path: pathString}))}>
					<input type="hidden" name="path" value={pathString}/>
					<FileInput
						name="file"
						multiple
						required
						label="Select file(s) to upload"
						placeholder="Choose file(s)"
						accept="*/*"
					/>
					<Group mt="md" justify="flex-end">
						<Button variant="default" type="button"
										onClick={() => navigate(urlBuilder({path: pathString}))}>Cancel</Button>
						<Button color="green" type="submit" name="type" value="upload">Upload</Button>
					</Group>
				</Form>
			</Modal>
			<UploadFilesModal opened={location.hash === "#upload"} path={pathString}
												onClose={() => navigate(urlBuilder({path: pathString}))}/>
		</Stack>
	);
}

type UploadFilesModalProps = {
	opened: boolean;
	onClose: () => void;
	path: string;
}

function UploadFilesModal({onClose, path, opened}: UploadFilesModalProps) {
	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Upload file"
			centered
		>
			<Form method="POST" encType="multipart/form-data" onSubmit={onClose}>
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
					<Button variant="default" type="button" onClick={onClose}>Cancel</Button>
					<Button color="green" type="submit" name="type" value="upload">Upload</Button>
				</Group>
			</Form>
		</Modal>
	);
}