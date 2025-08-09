import {Button, Group, Modal, Text} from "@mantine/core";
import {Form} from "react-router";

type DeleteFileModalProps = {
	path: string;
	deleteModal: { name: string, isDir: boolean } | null;
	onClose: () => void;
};

export default function DeleteFileModal({deleteModal, onClose, path}: DeleteFileModalProps) {
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