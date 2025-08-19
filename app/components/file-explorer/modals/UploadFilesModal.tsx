import {Button, FileInput, Group, Modal} from "@mantine/core";
import {Form, Link, useNavigate} from "react-router";
import {z} from "zod";

type UploadFilesModalProps = {
	opened: boolean;
	closePath: string;
	path: string;
};

export const uploadSchema = z.object({
	type: z.literal("upload"),
	path: z.string(),
	file: z.file(),
});

export default function UploadFilesModal({closePath, path, opened}: UploadFilesModalProps) {
	const navigate = useNavigate();
	if (!opened) return null;

	return (
		<Modal
			onClose={() => navigate(closePath)}
			title="Upload file(s)"
			centered
			opened
		>
			<Form method="POST" encType="multipart/form-data" action={closePath}>
				<input type="hidden" name="path" value={path}/>
				<FileInput
					name="file"
					required
					label="Select file to upload"
					placeholder="Choose file"
					accept="*/*"
				/>
				<Group mt="md" justify="flex-end">
					<Button component={Link} to={closePath} variant="light" color="gray" type="button">Cancel</Button>
					<Button color="blue" type="submit" name="type" value="upload">Upload</Button>
				</Group>
			</Form>
		</Modal>
	);
}