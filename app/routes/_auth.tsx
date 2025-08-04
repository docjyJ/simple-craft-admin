import {AppShell, Burger, Group, NavLink} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {Link, Outlet} from "react-router";
import {IconServer} from "@tabler/icons-react";



export default function Shell() {
	const [opened, {toggle}] = useDisclosure();

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
						onClick={toggle}
						hiddenFrom="sm"
						size="sm"
					/>
					<div>Logo</div>
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