import { Button, Group, Stack, Textarea, TextInput } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { sendCommandToServer } from '~/utils.server/minecraft-servers';
import { Form } from 'react-router';
import type { Route } from './+types/index';
import { useEffect, useState } from 'react';

export async function action({ request, params }: Route.ActionArgs) {
  const { uid } = params;
  const formData = await request.formData();
  const command = formData.get('command');
  if (typeof command === 'string' && uid) {
    sendCommandToServer(uid, command);
  }
}

export default function ServerConsole({ params: { uid } }: Route.ComponentProps) {
  const [log, setLog] = useState<string[]>([]);
  useEffect(() => {
    let isMounted = true;
    const fetchLog = async () => {
      const res = await fetch(`/servers/${uid}/log?lines=${log.length}`);
      if (res.ok) {
        const data = await res.json();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setLog((prev) => {
            return prev.concat(data);
          });
        }
      }
    };
    const interval = setInterval(fetchLog, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  });

  return (
    <Stack>
      <Textarea
        placeholder="Console output will appear here..."
        readOnly
        value={log.join('\n')}
        autosize
        minRows={20}
        maxRows={20}
      />

      <Form method="post">
        <Group align="end">
          <TextInput
            placeholder="Type a command here..."
            autoComplete="off"
            name="command"
            autoFocus
            style={{ flexGrow: 1 }}
          />
          <Button variant="outline" color="blue" type="submit" leftSection={<IconSend />}>
            Send
          </Button>
        </Group>
      </Form>
    </Stack>
  );
}
