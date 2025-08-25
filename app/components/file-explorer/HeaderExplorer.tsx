import { Anchor, Breadcrumbs, Group, Paper, Text } from '@mantine/core';
import { Link } from 'react-router';
import React from 'react';
import { encodePathParam } from '~/utils/path-utils';

export default function HeaderExplorer({
  leftSection,
  pathArray,
}: {
  pathArray: string[];
  leftSection: React.ReactNode;
}) {
  const pathWithRoot = ['', ...pathArray];
  return (
    <Group style={{ flexWrap: 'nowrap' }}>
      <Paper withBorder style={{ flexGrow: 1, overflowX: 'auto' }}>
        <Breadcrumbs m="sm" style={{ flexWrap: 'nowrap' }}>
          {pathWithRoot.map((p, index) => {
            const targetPath = '/' + pathArray.slice(0, index).join('/');
            if (pathWithRoot.length - 1 === index) {
              return <Text key={index}>{index === 0 ? 'Root' : p}</Text>;
            }
            return (
              <Anchor
                key={index}
                component={Link}
                to={`?path=${encodePathParam(targetPath === '//' ? '/' : targetPath)}`}
              >
                {index === 0 ? 'Root' : p}
              </Anchor>
            );
          })}
        </Breadcrumbs>
      </Paper>
      {leftSection}
    </Group>
  );
}
