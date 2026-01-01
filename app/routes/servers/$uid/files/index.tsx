import { readdir } from 'node:fs/promises';
import { ActionIcon, Anchor, Breadcrumbs, Button, Group, Paper, Stack, Table, Text } from '@mantine/core';
import {
  IconDownload,
  IconEdit,
  IconFile,
  IconFileText,
  IconFileZip,
  IconFolder,
  IconFolderUp,
  IconPencil,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { encodePathParam, isArchive, isText } from '~/utils/path-utils';
import { getPathFromUrl, requireDirectory, resolveSafePath } from '~/utils.server/path-validation';
import { requireAuth } from '~/utils.server/session';
import type { Route } from './+types/index';

export async function loader({ params, request }: Route.LoaderArgs) {
  await requireAuth(request);
  const path = getPathFromUrl(request.url);
  const fullPath = resolveSafePath(params.uid, path);
  await requireDirectory(fullPath);
  const dirEntries = await readdir(fullPath, { withFileTypes: true });
  const entries = dirEntries
    .map((entry) => ({
      name: entry.name,
      type: entry.isDirectory()
        ? ('folder' as const)
        : isArchive(entry.name)
          ? ('archive' as const)
          : isText(entry.name)
            ? ('text' as const)
            : ('binary' as const),
    }))
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));
  return { entries, path };
}

export default function FileExplorerIndex({ loaderData: { entries, path } }: Route.ComponentProps) {
  const pathArray = path === '/' ? [''] : path.split('/');
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Stack miw={600}>
      <Group style={{ flexWrap: 'nowrap' }}>
        <Paper withBorder style={{ flexGrow: 1, overflowX: 'auto' }}>
          <Breadcrumbs m="sm" style={{ flexWrap: 'nowrap' }}>
            {[...pathArray].map((seg, idx, arr) => {
              const target = pathArray.slice(0, idx + 1).join('/') || '/';
              return idx === arr.length - 1 ? (
                <Text key={target}>{idx === 0 ? t(($) => $.server.files.root) : seg}</Text>
              ) : (
                <Anchor key={target} component={Link} to={`?path=${encodePathParam(target)}`}>
                  {idx === 0 ? t(($) => $.server.files.root) : seg}
                </Anchor>
              );
            })}
          </Breadcrumbs>
        </Paper>
        <Button
          component={Link}
          to={`download?path=${encodePathParam(path)}`}
          download
          reloadDocument
          color="blue"
          aria-label={t(($) => $.server.files.downloadFolder)}
          leftSection={<IconDownload />}
        >
          {t(($) => $.server.files.download)}
        </Button>
        <Button
          component={Link}
          to={`upload?path=${encodePathParam(path)}`}
          color="blue"
          aria-label={t(($) => $.server.files.upload)}
          leftSection={<IconUpload />}
        >
          {t(($) => $.server.files.upload)}
        </Button>
      </Group>
      <Paper withBorder>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t(($) => $.server.files.name)}</Table.Th>
              <Table.Th>{t(($) => $.server.files.type)}</Table.Th>
              <Table.Th>{t(($) => $.server.files.actions)}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {entries.map((entry) => {
              const filePath = [...pathArray, entry.name].join('/');
              return (
                <Table.Tr
                  key={entry.name}
                  onClick={() => entry.type === 'folder' && navigate(`?path=${encodePathParam(filePath)}`)}
                  style={{ cursor: entry.type === 'folder' ? 'pointer' : 'default' }}
                >
                  <Table.Td>
                    {entry.type === 'folder' ? (
                      <IconFolder />
                    ) : entry.type === 'archive' ? (
                      <IconFileZip />
                    ) : entry.type === 'text' ? (
                      <IconFileText />
                    ) : (
                      <IconFile />
                    )}{' '}
                    {entry.name}
                  </Table.Td>
                  <Table.Td>
                    {entry.type === 'folder'
                      ? t(($) => $.server.files.folder)
                      : entry.type === 'archive'
                        ? t(($) => $.server.files.archive)
                        : entry.type === 'text'
                          ? t(($) => $.server.files.textFile)
                          : t(($) => $.server.files.binaryFile)}
                  </Table.Td>
                  <Table.Td>
                    <Group>
                      <ActionIcon
                        component={Link}
                        to={`delete?path=${encodePathParam(filePath)}`}
                        color="red"
                        type="button"
                        aria-label={t(($) => $.server.files.delete)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconTrash />
                      </ActionIcon>
                      <ActionIcon
                        component={Link}
                        to={`download?path=${encodePathParam(filePath)}`}
                        download
                        reloadDocument
                        color="blue"
                        type="button"
                        aria-label={
                          entry.type === 'folder'
                            ? t(($) => $.server.files.downloadFolder)
                            : t(($) => $.server.files.downloadFile)
                        }
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconDownload />
                      </ActionIcon>
                      <ActionIcon
                        component={Link}
                        to={`rename?path=${encodePathParam(filePath)}`}
                        color="blue"
                        type="button"
                        aria-label={t(($) => $.server.files.rename)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconPencil />
                      </ActionIcon>
                      {entry.type === 'archive' && (
                        <ActionIcon
                          component={Link}
                          to={`extract?path=${encodePathParam(filePath)}`}
                          color="blue"
                          type="button"
                          aria-label={t(($) => $.server.files.extractArchive)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconFolderUp />
                        </ActionIcon>
                      )}
                      {entry.type === 'text' && (
                        <ActionIcon
                          component={Link}
                          to={`edit?path=${encodePathParam(filePath)}`}
                          color="blue"
                          type="button"
                          aria-label={t(($) => $.server.files.editFile)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconEdit />
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}
