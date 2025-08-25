import { Stack, Text, Button } from '@mantine/core';
import HeaderExplorer from '~/components/file-explorer/HeaderExplorer';
import { useLocation, Link } from 'react-router';
import { IconDownload } from '@tabler/icons-react';
import { encodePathParam } from '~/utils/path-utils';

type ArchiveViewerProps = {
  archiveFiles: string[];
};

export default function ArchiveViewer({ archiveFiles }: ArchiveViewerProps) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const pathArray = (searchParams.get('path') ?? '').split('/').filter(Boolean);
  const pathString = '/' + pathArray.join('/');
  return (
    <Stack>
      <HeaderExplorer
        leftSection={
          <Button
            component={Link}
            to={`download?path=${encodePathParam(pathString)}`}
            download
            reloadDocument
            color="blue"
            aria-label="Download archive"
            leftSection={<IconDownload />}
          >
            Download
          </Button>
        }
        pathArray={pathArray}
      />

      {archiveFiles.map((name) => (
        <Text key={name}>{name}</Text>
      ))}
    </Stack>
  );
}
