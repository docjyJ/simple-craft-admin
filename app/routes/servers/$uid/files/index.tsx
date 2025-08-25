import type { Route } from './+types/index';
import { cleanPath, encodePathParam } from '~/utils/path-utils';
import { Link, useNavigate } from 'react-router';
import {
  ActionIcon,
  Anchor,
  Breadcrumbs,
  Button,
  Group,
  Paper,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { isArchive, isText, resolveSafePath } from '~/server/path-validation';
import { readdir, stat } from 'node:fs/promises';
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

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const rawPath = url.searchParams.get('path') || '';
  const path = cleanPath(rawPath);
  try {
    const fullPath = resolveSafePath(params.uid, path);
    const s = await stat(fullPath);
    if (!s.isDirectory()) {
      return new Response('Bad Request: not a directory', { status: 400 });
    }
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
      .sort((a, b) =>
        a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1,
      );
    return { entries, path };
  } catch (e: any) {
    if (e?.code === 'ENOENT') return new Response('Not Found', { status: 404 });
    throw e;
  }
}

export default function FileExplorerIndex({ loaderData: { entries, path } }: Route.ComponentProps) {
  const pathArray = path === '/' ? [''] : path.split('/');
  const navigate = useNavigate();
  return (
    <Stack miw={600}>
      <Group style={{ flexWrap: 'nowrap' }}>
        <Paper withBorder style={{ flexGrow: 1, overflowX: 'auto' }}>
          <Breadcrumbs m="sm" style={{ flexWrap: 'nowrap' }}>
            {[...pathArray].map((seg, idx, arr) => {
              const target = pathArray.slice(0, idx + 1).join('/');
              return idx === arr.length - 1 ? (
                <Text key={idx}>{idx === 0 ? 'Root' : seg}</Text>
              ) : (
                <Anchor
                  key={idx}
                  component={Link}
                  to={`?path=${encodePathParam(target === '' ? '/' : target)}`}
                >
                  {idx === 0 ? 'Root' : seg}
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
          aria-label="Download folder"
          leftSection={<IconDownload />}
        >
          Download
        </Button>
        <Button
          component={Link}
          to={`upload?path=${encodePathParam(path)}`}
          color="blue"
          aria-label="Upload file"
          leftSection={<IconUpload />}
        >
          Upload
        </Button>
      </Group>
      <Paper withBorder>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {entries.map((entry) => {
              const filePath = [...pathArray, entry.name].join('/');
              return (
                <Table.Tr
                  key={entry.name}
                  onClick={() =>
                    entry.type === 'folder' && navigate(`?path=${encodePathParam(filePath)}`)
                  }
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
                      ? 'Folder'
                      : entry.type === 'archive'
                        ? 'Archive'
                        : entry.type === 'text'
                          ? 'Text file'
                          : 'Binary file'}
                  </Table.Td>
                  <Table.Td>
                    <Group>
                      <ActionIcon
                        component={Link}
                        to={`delete?path=${encodePathParam(filePath)}`}
                        color="red"
                        type="button"
                        aria-label="Delete"
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
                        aria-label={entry.type === 'folder' ? 'Download folder' : 'Download file'}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconDownload />
                      </ActionIcon>
                      <ActionIcon
                        component={Link}
                        to={`rename?path=${encodePathParam(filePath)}`}
                        color="blue"
                        type="button"
                        aria-label="Rename"
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
                          aria-label="Extract archive"
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
                          aria-label="Edit file"
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
