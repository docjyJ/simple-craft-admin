import {Anchor, Breadcrumbs, Group, Paper, Text} from "@mantine/core";
import {Link} from "react-router";
import React from "react";
import {urlBuilder} from "~/hooks/file-explorer/useExplorerLocation";


export default function HeaderExplorer({leftSection, pathArray}: {
	pathArray: string[],
	leftSection: React.ReactNode
}) {
	const pathWithRoot = [
		"",
		...pathArray
	];
	return (
		<Group style={{flexWrap: "nowrap"}}>
			<Paper withBorder style={{flexGrow: 1, overflowX: "auto"}}>
				<Breadcrumbs m="sm" style={{flexWrap: "nowrap"}}>
					{pathWithRoot.map((p, index) => (
						pathWithRoot.length - 1 === index ? (
							<Text key={index}>{index === 0 ? "Root" : p}</Text>
						) : (
							<Anchor
								key={index}
								component={Link}
								to={urlBuilder({path: "/" + pathArray.slice(0, index).join("/")})}
							>
								{index === 0 ? "Root" : p}
							</Anchor>
						)
					))}
				</Breadcrumbs>
			</Paper>
			{leftSection}
		</Group>
	);
}