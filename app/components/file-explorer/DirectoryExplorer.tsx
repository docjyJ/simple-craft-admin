import type { FolderEntry } from '~/server/file-explorer';
import { Link, useNavigate } from 'react-router';
import { ActionIcon, Group, Stack, Table } from '@mantine/core';
import HeaderExplorer from '~/components/file-explorer/HeaderExplorer';
import {
  IconDownload,
  IconFile,
  IconFileZip,
  IconFolder,
  IconFolderUp,
  IconTrash,
  IconPencil,
} from '@tabler/icons-react';
import { DownloadButton, UploadButton } from '~/components/file-explorer/buttons';
import useExplorerLocation, { urlBuilder } from '~/hooks/file-explorer/useExplorerLocation';
import DeleteFileModal from '~/components/file-explorer/modals/DeleteFileModal';
import UploadFilesModal from '~/components/file-explorer/modals/UploadFilesModal';
import { ExtractArchiveModal, RenameFileModal } from '~/components/file-explorer/modals';

type DirectoryExplorerProps = {
  entries: FolderEntry[];
};

export default function DirectoryExplorer({ entries }: DirectoryExplorerProps) {
  const {
    pathArray,
    pathString,
    fileParam,
    upload,
    delete: del,
    extract,
    rename,
  } = useExplorerLocation();
  const navigate = useNavigate();
  return (
    <Stack miw={600}>
      <HeaderExplorer
        leftSection={
          <>
            <DownloadButton isFile={false} to={urlBuilder({ path: pathString, download: true })} />
            <UploadButton to={urlBuilder({ path: pathString, upload: true })} />
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
                onClick={() => navigate(urlBuilder({ path: filePath }))}
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
                      to={urlBuilder({ path: pathString, file: entry.name, delete: true })}
                      color="red"
                      type="button"
                      aria-label="Delete file"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconTrash />
                    </ActionIcon>
                    <ActionIcon
                      component={Link}
                      to={urlBuilder({ path: filePath, download: true })}
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
                      to={urlBuilder({ path: pathString, file: entry.name, rename: true })}
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
                        to={urlBuilder({ path: pathString, file: entry.name, extract: true })}
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
      <DeleteFileModal
        opened={del}
        path={fileParam ? `${pathString}/${fileParam}` : pathString}
        closePath={urlBuilder({ path: pathString })}
      />
      <UploadFilesModal
        opened={upload}
        path={fileParam ? `${pathString}/${fileParam}` : pathString}
        closePath={urlBuilder({ path: pathString })}
      />
      <ExtractArchiveModal
        opened={extract}
        path={fileParam ? `${pathString}/${fileParam}` : pathString}
        closePath={urlBuilder({ path: pathString })}
      />
      <RenameFileModal
        opened={rename}
        path={fileParam ? `${pathString}/${fileParam}` : pathString}
        closePath={urlBuilder({ path: pathString })}
      />
    </Stack>
  );
}
