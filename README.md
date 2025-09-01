# Minecraft Docker

A simple web application to manage Minecraft servers using Docker.

## Features

- Create, manage, and monitor Minecraft servers
- User authentication
- Web interface built with React
- Docker-based server deployment

## Getting Started

### Quick run

```bash
docker run -d -p 80:3000 \
    -e ADMIN_PASSWORD=admin \
    -e SESSION_SECRET=$(openssl rand -hex 32) \
    -v /path/to/config:/app/config \
    -v /path/to/minecraft:/app/minecraft \
    -v /path/to/backup:/app/backup \
    --name simple-craft-admin \
    ghcr.io/docjyj/simple-craft-admin:latest
```

### docker-compose example

```yaml
services:
  minecraft:
    image: ghcr.io/docjyj/simple-craft-admin:latest
    restart: always
    container_name: simple-craft-admin
    environment:
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - SESSION_SECRET=${SESSION_SECRET}
    ports:
      - '80:3000'
    volumes:
      - ./config:/app/config
      - ./minecraft:/app/minecraft
      - ./backup:/app/backup
```

## License

See [LICENSE](./LICENSE).
