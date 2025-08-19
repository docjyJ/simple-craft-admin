import { Link } from 'react-router';
import { Button } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';

export default function DownloadButton({ isFile, to }: { isFile: boolean; to: string }) {
  return (
    <Button
      component={Link}
      to={to}
      download
      reloadDocument
      color="blue"
      aria-label={isFile ? 'Download file' : 'Download folder'}
      leftSection={<IconDownload />}
    >
      Download
    </Button>
  );
}
