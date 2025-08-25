import type { FolderEntry } from '~/server/file-explorer';
import { Link, useLocation, useNavigate } from 'react-router';
import { ActionIcon, Group, Stack, Table, Button } from '@mantine/core';
import HeaderExplorer from '~/components/file-explorer/HeaderExplorer';
import {
  IconDownload,
  IconFile,
  IconFileZip,
  IconFolder,
  IconFolderUp,
  IconPencil,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { encodePathParam } from '~/utils/path-utils';

export default function DirectoryExplorer({ entries }: { entries: FolderEntry[] }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const pathArray = (searchParams.get('path') ?? '').split('/').filter(Boolean);
  const pathString = '/' + pathArray.join('/');
  const navigate = useNavigate();
  return (
    <Stack miw={600}>
      <HeaderExplorer
        leftSection={
          <>
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
          </>
        }
        pathArray={pathArray}
      />
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
            return (
              <Table.Tr
                key={entry.name}
                onClick={() => navigate(`?path=${encodePathParam(filePath)}`)}
                style={{ cursor: 'pointer' }}
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
                      : 'File'}
                </Table.Td>
                <Table.Td>
                  <Group>
                    <ActionIcon
                      component={Link}
                      to={`delete?path=${encodePathParam(filePath)}`}
                      color="red"
                      type="button"
                      aria-label="Delete file"
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
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}
