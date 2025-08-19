import {Button, Group, Modal, Text} from "@mantine/core";
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
	path: z.string()
});

export default function ExtractArchiveModal({opened, closePath, path}: ExtractArchiveModalProps) {
	const navigate = useNavigate();
	if (!opened) return null;

	const fileName = path.split("/").pop() || "";

	return (
		<Modal
			opened
			centered
			title="Extract Archive"
			onClose={() => navigate(closePath)}
		>
			<Text size="sm" mb="md">
				Extracting <strong>{fileName}</strong> will decompress its contents into a directory with the same name.<br/>
			</Text>
			<ValidatedForm
				method="post"
				action={closePath}
				schema={extractSchema}
				defaultValues={{type: "extract", path}}
			>
				{(form) => (
					<>
						<input type="hidden" {...form.getInputProps("type")}/>
						<input type="hidden" {...form.getInputProps("path")}/>
						<Group mt="md" justify="flex-end">
							<Button component={Link} to={closePath} variant="subtle" color="gray" type="button">
								cancel
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