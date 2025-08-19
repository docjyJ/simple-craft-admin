import {Button, Group, Modal, Text, TextInput} from "@mantine/core";
import {Link, useNavigate} from "react-router";
import {z} from "zod";
import {ValidatedForm} from "@rvf/react-router";

type ExtractArchiveModalProps = {
	opened: boolean;
	closePath: string;
	path: string;
};

export const extractSchema = z.object({
	type: z.literal("extract"),
	path: z.string(),
	destinationDir: z.string()
});

export default function ExtractArchiveModal({opened, closePath, path}: ExtractArchiveModalProps) {
	const navigate = useNavigate();
	if (!opened) return null;

	const fileName = path.split("/").pop() || "";
	const defaultDest = path.slice(0, -4);

	return (
		<Modal
			opened
			centered
			title="Extract Archive"
			onClose={() => navigate(closePath)}
		>
			<Text size="sm" mb="md">
				Extracting <strong>{fileName}</strong> will decompress its contents into the destination folder.
			</Text>
			<ValidatedForm
				method="post"
				action={closePath}
				schema={extractSchema}
				defaultValues={{type: "extract", path, destinationDir: defaultDest}}
			>
				{(form) => (
					<>
						<input type="hidden" {...form.getInputProps("type")} />
						<input type="hidden" {...form.getInputProps("path")} />
						<TextInput
							label="Destination folder"
							placeholder="/path/inside/server"
							{...form.getInputProps("destinationDir")}
						/>
						<Group mt="md" justify="flex-end">
							<Button component={Link} to={closePath} variant="subtle" color="gray" type="button">
								Cancel
							</Button>
							<Button
								color="blue"
								type="submit"
								loading={form.formState.isSubmitting}
							>
								Extract
							</Button>
						</Group>
					</>
				)}
			</ValidatedForm>
		</Modal>
	);
}