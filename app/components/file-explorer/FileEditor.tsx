import { Button, Stack } from '@mantine/core';
import HeaderExplorer from '~/components/file-explorer/HeaderExplorer';
import CodeMirror from '@uiw/react-codemirror';
import { loadLanguage } from '@uiw/codemirror-extensions-langs';
import { useState } from 'react';
import { z } from 'zod';
import { Form, Link, useLocation } from 'react-router';
import { IconDeviceFloppy, IconDownload } from '@tabler/icons-react';
import { encodePathParam } from '~/utils/path-utils';

type FileEditorProps = {
  fileContent: string;
};

export const saveSchema = z.object({
  type: z.literal('save'),
  path: z.string(),
  content: z.string(),
});

export default function FileEditor({ fileContent }: FileEditorProps) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const pathArray = (searchParams.get('path') ?? '').split('/').filter(Boolean);
  const pathString = '/' + pathArray.join('/');

  const ext = pathString.split('.').pop();

  const lang = ext ? loadLanguage(ext) : null;

  const [value, setValue] = useState(fileContent);

  return (
    <Stack>
      <HeaderExplorer
        leftSection={
          <>
            <Button
              component={Link}
              to={`download?path=${encodePathParam(pathString)}`}
              download
              reloadDocument
              color="blue"
              aria-label="Download file"
              leftSection={<IconDownload />}
            >
              Download
            </Button>
            <Form action={`?path=${encodePathParam(pathString)}`} method="POST">
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
