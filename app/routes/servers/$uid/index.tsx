import { Button, Group, Paper, Stack, Text, TextInput } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import type { Route } from './+types/index';
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { z } from 'zod';
import { getOrCreateServer } from '~/utils.server/server-minecraft';
import type { LogLine } from '~/type';
import { requireAuth } from '~/utils.server/session';

const commandSchema = z.object({
  command: z
    .string()
    .trim()
    .min(1, 'Command cannot be empty')
    .max(32767, 'Command too long')
    .transform((s) => s.trim()),
});

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  await requireAuth(request);
  const result = await parseFormData(request, commandSchema);
  if (result.error) return validationError(result.error, result.submittedData);
  if (!getOrCreateServer(uid).sendCommand(result.data.command)) {
    return validationError(
      { formId: result.formId, fieldErrors: { command: 'Failed to send command, is the server running?' } },
      result.submittedData,
    );
  }
}

// TODO: clean code, create hooks for log stream
export default function ServerConsole({ params: { uid } }: Route.ComponentProps) {
  const [log, setLog] = useState<LogLine[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const resetRef = useRef<() => void>(() => {});

  const checkStick = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [log, scrollToBottom]);

  useEffect(() => {
    if (!uid) return;
    let es: EventSource | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      es = new EventSource(`/servers/${uid}/log`);

      es.addEventListener('init', (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data);
          if (Array.isArray(data)) {
            setLog(
              data
                .filter((l: any) => l && (l.out || l.err || l.in))
                .map((l: any) => ({ out: l.out, err: l.err, in: l.in })),
            );
          }
        } catch {}
      });

      es.addEventListener('append', (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data);
          if (data && (data.out || data.err || data.in)) {
            setLog((prev) => prev.concat([{ out: data.out, err: data.err, in: data.in }]));
          }
        } catch {}
      });

      es.onerror = () => {
        if (es && es.readyState === EventSource.CLOSED) {
          setTimeout(connect, 1000);
        }
      };
    };

    connect();
    return () => {
      closed = true;
      if (es) es.close();
    };
  }, [uid]);

  const renderLine = (entry: { out?: string; err?: string; in?: string }, idx: number) => {
    if (entry.in) {
      return (
        <Text key={idx} c="green" component="i">
          {'> ' + entry.in}
        </Text>
      );
    }
    if (entry.err) {
      return (
        <Text key={idx} c="red" fw={700}>
          {entry.err}
        </Text>
      );
    }
    return (
      <Text key={idx} c="dark">
        {entry.out}
      </Text>
    );
  };

  return (
    <Stack>
      <Paper ref={scrollRef} onScroll={checkStick} withBorder p="xs" h={360} style={{ overflow: 'auto', fontSize: 12 }}>
        {log.map(renderLine)}
      </Paper>

      <ValidatedForm
        method="post"
        schema={commandSchema}
        defaultValues={{ command: '' }}
        onSubmitSuccess={() => {
          resetRef.current();
        }}
      >
        {(form) => {
          resetRef.current = () => form.resetField('command');
          const errorCommand = form.error('command');
          return (
            <Stack>
              <Group align="end">
                <TextInput
                  placeholder="Enter a command..."
                  autoComplete="off"
                  {...form.getInputProps('command')}
                  style={{ flexGrow: 1 }}
                />
                <Button
                  variant="outline"
                  color="blue"
                  type="submit"
                  leftSection={<IconSend />}
                  loading={form.formState.isSubmitting}
                >
                  Send
                </Button>
              </Group>
              {form.formState.submitStatus === 'error' && errorCommand && (
                <Text c="red" fz="sm">
                  {errorCommand}
                </Text>
              )}
            </Stack>
          );
        }}
      </ValidatedForm>
    </Stack>
  );
}
