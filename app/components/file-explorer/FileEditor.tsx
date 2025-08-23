import { Button, Stack } from '@mantine/core';
import HeaderExplorer from '~/components/file-explorer/HeaderExplorer';
import { DownloadButton } from '~/components/file-explorer/buttons';
import useExplorerLocation, { urlBuilder } from '~/hooks/file-explorer/useExplorerLocation';
import CodeMirror from '@uiw/react-codemirror';
import { loadLanguage } from '@uiw/codemirror-extensions-langs';
import { useState } from 'react';
import { z } from 'zod';
import { Form } from 'react-router';
import { IconDeviceFloppy } from '@tabler/icons-react';

type FileEditorProps = {
  fileContent: string;
};

export const saveSchema = z.object({
  type: z.literal('save'),
  path: z.string(),
  content: z.string(),
});

export default function FileEditor({ fileContent }: FileEditorProps) {
  const { pathArray, pathString } = useExplorerLocation();

  const ext = pathString.split('.').pop();

  const lang = ext ? loadLanguage(ext) : null;

  const [value, setValue] = useState(fileContent);

  return (
    <Stack>
      <HeaderExplorer
        leftSection={
          <>
            <DownloadButton isFile={true} to={urlBuilder({ path: pathString, download: true })} />
            <Form action={urlBuilder({ path: pathString })} method="POST">
              <input type="hidden" name="type" value="save" />
              <input type="hidden" name="path" value={pathString} />
              <input type="hidden" name="content" value={value} />
              <Button
                color="green"
                aria-label="Save File"
                leftSection={<IconDeviceFloppy />}
                type="submit"
              >
                Save
              </Button>
            </Form>
          </>
        }
        pathArray={pathArray}
      />
      <CodeMirror
        value={fileContent}
        extensions={lang ? [lang] : undefined}
        onChange={(value) => setValue(value)}
      />
    </Stack>
  );
}
