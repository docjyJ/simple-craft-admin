import type {Route} from './+types/_auth.servers.$uid.files._index';
import {useSearchParams, Form, Link} from "react-router";
import {deleteMinecraftServerFile, getMinecraftServerFiles, uploadMinecraftServerFiles} from "~/server/file-explorer";
import {IconFile, IconFolder, IconTrash, IconDownload} from "@tabler/icons-react";
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
	const files = await getMinecraftServerFiles(params.uid, path);
	return {files};
}

export async function action({request, params}: Route.ActionArgs) {
	const formData = await request.formData();
	const type = formData.get("type");
	const path = formData.get("path");

	if (type === "delete" && typeof path === "string" && path.trim() !== "") {
		await deleteMinecraftServerFile(params.uid, path);
		return null;
	}

	if (type === "upload" && typeof path === "string") {
		const files: {name: string, buffer: Buffer}[] = [];
		for (const entry of formData.getAll("file")) {
			if (typeof entry === "object" && entry) {
				const arrayBuffer = await entry.arrayBuffer();
				files.push({
					name: entry.name,
					buffer: Buffer.from(arrayBuffer),
				});
			}
		}
		await uploadMinecraftServerFiles(params.uid, path, files);
		return null;
	}

	return null;
}

const FORBIDDEN_PATHS = ["..", ".", ""];

export default function FileExplorer({loaderData: {files}}: Route.ComponentProps) {
	const [searchParms, setSearchParams] = useSearchParams();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [uploadOpen, setUploadOpen] = useState(false);
	const [fileToDelete, setFileToDelete] = useState<{ name: string, isDir: boolean, path: string } | null>(null);

	const handleNavigate = (newPath: string) => {
		setSearchParams({path: newPath});
	};

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
										onClick={() => handleNavigate(pathWithRoot.slice(1, index + 1).join("/"))}
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
					to={`download?path=${encodeURIComponent(pathString)}`}
					download reloadDocument
					color="blue"
					aria-label={files.type === "file" ? "Download current file" : "Download current folder"}
					leftSection={<IconDownload/>}
				>
					Download
				</Button>
				{
					files.type === "file" ? (
							<Button
								color="red"
								aria-label="Delete file"
								onClick={() => {
									setFileToDelete({name: pathArray[pathArray.length - 1], isDir: false, path: pathString});
									setDeleteOpen(true);
								}}
								leftSection={<IconTrash/>}
							>
								Delete
							</Button>
						)
						: (
							<Button
								color="green"
								aria-label="Upload file"
								onClick={() => {
									setUploadOpen(true);
								}}
								leftSection={<IconFile/>}
							>
								Upload
							</Button>
						)
				}
			</Group>
			{
				files.type === "file" ? (
					<CodeMirror
						value={files.content}
						readOnly={true}
						style={{fontSize: 14}}
					/>
				) : (
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
								{files.child.map((file) => {
									const filePath = [...pathArray, file.name].join("/");
									return (
										<Table.Tr
											key={file.name}
											onClick={() => handleNavigate(filePath)}
											style={{cursor: "pointer"}}
										>
											<Table.Td>
												{file.isDir ? <IconFolder/> : <IconFile/>} {file.name}
											</Table.Td>
											<Table.Td>
												{file.isDir ? "Folder" : "File"}
											</Table.Td>
											<Table.Td>
												<ActionIcon
													color="red"
													type="button"
													aria-label="Delete file"
													onClick={e => {
														e.stopPropagation();
														setFileToDelete({name: file.name, isDir: file.isDir, path: filePath});
														setDeleteOpen(true);
													}}
												>
													<IconTrash/>
												</ActionIcon>
												<ActionIcon
													component={Link}
													to={`download?path=${encodeURIComponent(filePath)}`}
													download reloadDocument
													color="blue"
													type="button"
													aria-label={file.isDir ? "Download folder" : "Download file"}
													onClick={e => e.stopPropagation()}
												>
													<IconDownload/>
												</ActionIcon>
											</Table.Td>
										</Table.Tr>
									);
								})}
							</Table.Tbody>
						</Table>
					</Table.ScrollContainer>
				)
			}
			<Modal
				opened={deleteOpen}
				onClose={() => setDeleteOpen(false)}
				title="Confirm Deletion"
				centered
			>
				{fileToDelete && (
					fileToDelete.isDir
						? <Text>Are you sure you want to delete entire {fileToDelete.name} directory?</Text>
						: <Text>Are you sure you want to delete {fileToDelete.name} file?</Text>
				)}
				<Form method="POST" onSubmit={() => setDeleteOpen(false)}>
					<input type="hidden" name="type" value="delete"/>
					<input type="hidden" name="path" value={fileToDelete?.path ?? ""}/>
					<Group mt="md" justify="flex-end">
						<Button variant="default" type="button" onClick={() => setDeleteOpen(false)}>Cancel</Button>
						<Button color="red" type="submit" name="type" value="delete">Delete</Button>
					</Group>
				</Form>
			</Modal>
			<Modal
				opened={uploadOpen}
				onClose={() => setUploadOpen(false)}
				title="Upload file"
				centered
			>
				<Form method="POST" encType="multipart/form-data" onSubmit={() => setUploadOpen(false)}>
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
						<Button variant="default" type="button" onClick={() => setUploadOpen(false)}>Cancel</Button>
						<Button color="green" type="submit" name="type" value="upload">Upload</Button>
					</Group>
				</Form>
			</Modal>
		</Stack>
	)
		;
}