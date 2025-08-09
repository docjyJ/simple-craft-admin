import {Button, FileInput, Group, Modal} from "@mantine/core";
import {Form, Link, useNavigate} from "react-router";

type UploadFilesModalProps = {
	opened: boolean;
	closePath: string;
	path: string;
}

export default function UploadFilesModal({closePath, path, opened}: UploadFilesModalProps) {
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