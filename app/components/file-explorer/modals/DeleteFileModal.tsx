import { Button, Group, Modal, Text } from '@mantine/core';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { ValidatedForm } from '@rvf/react-router';

type DeleteFileModalProps = {
  opened: boolean;
  closePath: string;
  path: string;
};

export const deleteSchema = z.object({
  type: z.literal('delete'),
  path: z.string(),
});

export default function DeleteFileModal({ closePath, path, opened }: DeleteFileModalProps) {
  const fileName = path.split('/').pop() || '';
  const navigate = useNavigate();
  if (!opened) return null;

  return (
    <Modal onClose={() => navigate(closePath)} title="Confirm Deletion" centered opened>
      <Text size="sm" mb="md">
        Are you sure you want to delete <strong>{fileName}</strong>?<br />
        This action cannot be undone.
      </Text>
      <ValidatedForm
        method="post"
        action={closePath}
        schema={deleteSchema}
        defaultValues={{ type: 'delete', path }}
      >
        {(form) => (
          <>
            <input type="hidden" {...form.getInputProps('type')} />
            <input type="hidden" {...form.getInputProps('path')} />
            <Group mt="md" justify="flex-end">
              <Button component={Link} to={closePath} variant="subtle" color="gray" type="button">
                Cancel
              </Button>
              <Button color="red" type="submit" loading={form.formState.isSubmitting}>
                Delete
              </Button>
            </Group>
          </>
        )}
      </ValidatedForm>
    </Modal>
  );
}
