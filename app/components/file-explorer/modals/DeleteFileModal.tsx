import {Button, Group, Modal, Text} from "@mantine/core";
import {Form, Link, useNavigate} from "react-router";

type DeleteFileModalProps = {
	opened: boolean;
	closePath: string;
	path: string;
};

export default function DeleteFileModal({closePath, path, opened}: DeleteFileModalProps) {
	const fileName = path.split("/").pop() || "";

	const navigate = useNavigate();
	if (!opened) return null;
	return (
		<Modal
			onClose={() => navigate(closePath)}
			title="Confirm Deletion"
			centered opened>
			<Text size="sm" mb="md">
				Are you sure you want to delete <strong>{fileName}</strong>?<br/>This action cannot be undone.
			</Text>
			<Form method="POST" action={closePath}>
				<input type="hidden" name="type" value="delete"/>
				<input type="hidden" name="path" value={path}/>
				<Group mt="md" justify="flex-end">
					<Button component={Link} to={closePath} variant="default" type="button">Cancel</Button>
					<Button color="red" type="submit" name="type" value="delete">Delete</Button>
				</Group>
			</Form>
		</Modal>
	);
}