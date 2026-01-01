import { Button, Group, Paper, Stack, Text, TextInput } from '@mantine/core';
import { parseFormData, ValidatedForm, validationError } from '@rvf/react-router';
import { IconSend } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import type { LogLine } from '~/type';
import { getOrCreateServer } from '~/utils.server/server-minecraft';
import { requireAuth } from '~/utils.server/session';
import type { Route } from './+types/index';

const commandSchema = z.object({
  command: z
    .string()
    .trim()
    .min(1, 'server.console.error.commandEmpty')
    .max(32767, 'server.console.error.commandTooLong')
    .transform((s) => s.trim()),
});

export async function action({ request, params: { uid } }: Route.ActionArgs) {
  await requireAuth(request);
  const result = await parseFormData(request, commandSchema);
  if (result.error) return validationError(result.error, result.submittedData);
  if (!getOrCreateServer(uid).sendCommand(result.data.command)) {
    return validationError(
      { formId: result.formId, fieldErrors: { command: 'server.console.error.commandFailed' } },
      result.submittedData,
    );
  }
  return null;
}

export default function ServerConsole({ params: { uid } }: Route.ComponentProps) {
  const { t } = useTranslation();
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
              data.filter((l) => l && (l.out || l.err || l.in)).map((l) => ({ out: l.out, err: l.err, in: l.in })),
            );
            scrollToBottom();
          }
        } catch {}
      });

      es.addEventListener('append', (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data);
          if (data && (data.out || data.err || data.in)) {
            setLog((prev) => prev.concat([{ out: data.out, err: data.err, in: data.in }]));
            scrollToBottom();
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
  }, [uid, scrollToBottom]);

  const renderLine = (entry: { out?: string; err?: string; in?: string }, idx: number) => {
    if (entry.in) {
      return (
        <Text key={idx} c="green" component="i">
          {`> ${entry.in}`}
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

  const parseError = (error: string | null) => {
    if (error === 'server.console.error.commandEmpty') return t(($) => $.server.console.error.commandEmpty);
    if (error === 'server.console.error.commandTooLong') return t(($) => $.server.console.error.commandTooLong);
    if (error === 'server.console.error.commandFailed') return t(($) => $.server.console.error.commandFailed);
    return error;
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
                  placeholder={t(($) => $.server.console.placeholder)}
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
                  {t(($) => $.server.console.send)}
                </Button>
              </Group>
              {form.formState.submitStatus === 'error' && errorCommand && (
                <Text c="red" fz="sm">
                  {parseError(errorCommand)}
                </Text>
              )}
            </Stack>
          );
        }}
      </ValidatedForm>
    </Stack>
  );
}
