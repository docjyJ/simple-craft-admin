import {AppShell, Burger, Group, NavLink} from '@mantine/core';
import {Link, Outlet} from "react-router";
import {IconServer} from "@tabler/icons-react";
import {useState} from "react";


export default function Shell() {
	const [opened, setOpened] = useState(false);

	return (
		<AppShell
			padding="md"
			header={{height: 60}}
			navbar={{
				width: 300,
				breakpoint: 'sm',
				collapsed: {mobile: !opened},
			}}
		>
			<AppShell.Header>
				<Group>
					<Burger
						opened={opened}
						onClick={() => setOpened(o => !o)}
						hiddenFrom="sm"
						size="sm"
					/>
					<div>SimpleCraftAdmin</div>
				</Group>
			</AppShell.Header>

			<AppShell.Navbar>
				<NavLink component={Link} to="/servers" label="Servers"
								 leftSection={<IconServer/>}
				/>
			</AppShell.Navbar>

			<AppShell.Main>
				<Outlet/>
			</AppShell.Main>
		</AppShell>
	);
}