import type { Route } from './+types/index';
import { encodePathParam, parentPath } from '~/utils/path-utils';
import { Link, useNavigate, redirect } from 'react-router';
import { ActionIcon, Button, Group, Paper, Stack, Table, Anchor, Breadcrumbs, Text } from '@mantine/core';
import { resolveSafePath } from '~/server/path-validation';
import { readdir, stat } from 'node:fs/promises';
import {
  IconDownload,
  IconFile,
  IconFileZip,
  IconFolder,
  IconFolderUp,
  IconPencil,
  IconTrash,
  IconUpload,
  IconEdit,
} from '@tabler/icons-react';

export async function loader({ params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const rawPath = url.searchParams.get('path') || '';
  const path = rawPath === '/' ? '' : rawPath; // normalisation simple
  try {
    const fullPath = resolveSafePath(params.uid, path);
    const s = await stat(fullPath);
    if (!s.isDirectory()) {
      const parent = parentPath(path) || '/';
      return redirect(`?path=${encodePathParam(parent)}`);
    }
    const dirEntries = await readdir(fullPath, { withFileTypes: true });
    const entries = dirEntries
      .map((entry) => ({
        name: entry.name,
        type: entry.isDirectory()
          ? ('folder' as const)
          : entry.name.endsWith('.zip')
            ? ('archive' as const)
            : ('file' as const),
      }))
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));
    return { entries, path };
  } catch (e) {
    console.warn(e);
    return { entries: [], path: '' };
  }
}

// Pas d'action ici

function isTextFile(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  const textExts = [
    'txt',
    'json',
    'yml',
    'yaml',
    'properties',
    'log',
    'md',
    'ts',
    'tsx',
    'js',
    'jsx',
    'css',
    'html',
    'env',
    'conf',
    'ini',
  ];
  return textExts.includes(ext);
}

export default function FileExplorerIndex({ loaderData: { entries, path } }: Route.ComponentProps) {
  const pathArray = path.split('/').filter(Boolean);
  const pathString = '/' + pathArray.join('/');
  const navigate = useNavigate();
  return (
    <Stack miw={600}>
      <Group style={{ flexWrap: 'nowrap' }}>
        <Paper withBorder style={{ flexGrow: 1, overflowX: 'auto' }}>
          <Breadcrumbs m="sm" style={{ flexWrap: 'nowrap' }}>
            {['', ...pathArray].map((seg, idx, arr) => {
              const isLast = idx === arr.length - 1;
              const target = '/' + pathArray.slice(0, idx).join('/');
              return isLast ? (
                <Text key={idx}>{idx === 0 ? 'Root' : seg}</Text>
              ) : (
                <Anchor
                  key={idx}
                  component={Link}
                  to={`?path=${encodePathParam(target === '//' ? '/' : target)}`}
                >
                  {idx === 0 ? 'Root' : seg}
                </Anchor>
              );
            })}
          </Breadcrumbs>
        </Paper>
        <Button
          component={Link}
          to={`download?path=${encodePathParam(pathString)}`}
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
          to={`upload?path=${encodePathParam(pathString)}`}
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
              const filePath = ['', ...pathArray, entry.name].join('/');
              const clickable = entry.type === 'folder';
              const textFile = entry.type === 'file' && isTextFile(entry.name);
              return (
                <Table.Tr
                  key={entry.name}
                  onClick={() => clickable && navigate(`?path=${encodePathParam(filePath)}`)}
                  style={{ cursor: clickable ? 'pointer' : 'default' }}
                >
                  <Table.Td>
                    {entry.type === 'folder' ? (
                      <IconFolder />
                    ) : entry.type === 'archive' ? (
                      <IconFileZip />
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
                        : textFile
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
                      {textFile && (
                        <ActionIcon
                          component={Link}
                          to={`edit?path=${encodePathParam(filePath)}`}
                          color="green"
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
