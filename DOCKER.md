# Docker Setup Guide for Shared Notes Bot

This guide explains how to run the Discord Shared Notes Bot using Docker and Docker Compose for easy setup and deployment.

---

## Prerequisites
- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed ([Get Docker Compose](https://docs.docker.com/compose/install/))
- A Discord bot token and client ID ([Discord Developer Portal](https://discord.com/developers/applications))

---

## 1. Clone the Repository

```sh
git clone https://github.com/M1XZG/discord-shared-posts-bot.git
cd discord-shared-posts-bot
```

---

## 2. Configure Environment Variables

Copy the example file and fill in your Discord credentials:

```sh
cp .env.example .env
# Edit .env and set DISCORD_TOKEN, CLIENT_ID, etc.
```

---

## 3. Build and Run with Docker Compose

```sh
docker compose up --build
```

- The bot will start automatically.
- All persistent data (database, configs) will be stored in the `data/` folder and mapped to the container.
- Environment variables are loaded from `.env`.

---

## 4. Updating the Bot

To update the bot, pull the latest code and rebuild:

```sh
git pull
docker compose up --build
```

---

## 5. Stopping the Bot

```sh
docker compose down
```

---

## 6. Troubleshooting
- Check logs with `![alt text](image.png)`.
- Make sure your `.env` file is correct and present.
- For advanced configuration, edit `docker-compose.yml`.

---

## 7. Customization
- You can change the data volume, environment variables, or other settings in `docker-compose.yml`.
- For production, consider using Docker Hub images and secrets management.

---

## More Info
- [Project README](./README.md)
- [Discord.js Documentation](https://discord.js.org/)
- [Docker Documentation](https://docs.docker.com/)

---

*Made for easy deployment and collaboration!*
