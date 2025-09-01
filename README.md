# Minecraft Docker

A simple web application to manage Minecraft servers using Docker.

## Features

- Create, manage, and monitor Minecraft servers
- User authentication
- Web interface built with React
- Docker-based server deployment

## Getting Started

```bash
docker run -d -p 80:3000 \
    -e ADMIN_PASSWORD=<YourDefaultAdminPassword> \
    -v /path/to/config:/app/config \
    -v /path/to/minecraft:/app/minecraft \
    -v /path/to/backup:/app/backup \
    --name simple-craft-admin \
    ghcr.io/docjyj/simple-craft-admin:latest
```

```yaml
services:
  minecraft:
    image: ghcr.io/docjyj/simple-craft-admin:latest
    restart: always
    container_name: simple-craft-admin
    environment:
      - ADMIN_PASSWORD=<YourDefaultAdminPassword>
    ports:
      - '80:3000'
    volumes:
      - ./config:/app/config
      - ./minecraft:/app/minecraft
      - ./backup:/app/backup
```
