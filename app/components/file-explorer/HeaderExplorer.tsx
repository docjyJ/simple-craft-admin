import {Anchor, Breadcrumbs, Group, Paper, ScrollArea, Text} from "@mantine/core";
import {Link} from "react-router";
import React from "react";
import {urlBuilder} from "~/hooks/file-explorer/useExplorerLocation";


export default function HeaderExplorer({leftSection, pathArray}: {
	pathArray: string[],
	leftSection: React.ReactNode
}) {
	const pathWithRoot = [
		"Root",
		...pathArray
	];
	return (
		<Group style={{flexWrap: "nowrap"}}>
			<Paper withBorder style={{flexGrow: 1, overflowX: "auto"}}>
				<Breadcrumbs m="sm" style={{flexWrap: "nowrap"}}>
					{pathWithRoot.map((p, index) => (
						pathWithRoot.length - 1 === index ? (
							<Text key={index}>{p}</Text>
						) : (
							<Anchor
								key={index}
								component={Link}
								to={urlBuilder({path: pathWithRoot.slice(1, index + 1).join("/")})}
							>
								{p}
							</Anchor>
						)
					))}
				</Breadcrumbs>
			</Paper>
			{leftSection}
		</Group>
	);
}