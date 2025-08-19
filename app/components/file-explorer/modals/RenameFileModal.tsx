import {Button, Group, Modal, TextInput} from "@mantine/core";
import {Link, useNavigate} from "react-router";
import {z} from "zod";
import {ValidatedForm} from "@rvf/react-router";

export type RenameFileModalProps = {
	opened: boolean;
	closePath: string;
	path: string;
};

export const renameSchema = z.object({
	type: z.literal("rename"),
	path: z.string(),
	newName: z.string().min(1, "Name is required")
});

export default function RenameFileModal({opened, closePath, path}: RenameFileModalProps) {
	const navigate = useNavigate();
	if (!opened) return null;
	return (
		<Modal opened centered title="Rename" onClose={() => navigate(closePath)}>
			<ValidatedForm
				method="post"
				action={closePath}
				schema={renameSchema}
				defaultValues={{type: "rename", path, newName: path.split("/").pop()}}
			>
				{(form) => (
					<>
						<input type="hidden" {...form.getInputProps("type")} />
						<input type="hidden" {...form.getInputProps("path")} />
						<TextInput label="New name" required {...form.getInputProps("newName")} error={form.error("newName")} />
						<Group mt="md" justify="flex-end">
							<Button component={Link} to={closePath} variant="subtle" color="gray" type="button">Cancel</Button>
							<Button color="blue" type="submit" loading={form.formState.isSubmitting}>Rename</Button>
						</Group>
					</>
				)}
			</ValidatedForm>
		</Modal>
	);
}
