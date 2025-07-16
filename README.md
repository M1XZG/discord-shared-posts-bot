# Discord Shared Posts Bot

A Discord bot that allows server administrators and moderators to create and manage shared posts that can be edited by multiple authorized users. This solves Discord's limitation where only the original message author can edit their posts.

## Features

- **Shared Post Management**: Create posts that can be edited by any authorized user
- **Role-Based Permissions**: Configure which roles can manage shared posts
- **Database Storage**: All posts are stored locally using SQLite
- **Edit History**: Tracks who created and last edited each post
- **Simple Commands**: Easy-to-use slash commands for all operations

## Prerequisites

- Node.js (version 16.9.0 or higher)
- npm or yarn
- A Discord Bot Token
- A Discord server where you have admin permissions

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/discord-shared-posts-bot.git
   cd discord-shared-posts-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your bot credentials:
   ```
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_bot_client_id_here
   DEV_GUILD_ID=your_test_server_id_here  # Optional: for development
   ```

5. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Running the Bot

### Production:
```bash
npm start
```

### Development (with auto-reload):
```bash
npm run dev
```

## Bot Setup

1. **Invite the bot** to your server with the following permissions:
   - Send Messages
   - Manage Messages
   - Use Slash Commands
   - Read Message History

2. **Configure permissions** (as server admin):
   ```
   /config addrole @ModeratorRole
   /config addrole @HelperRole
   ```

## Commands

### Configuration (Admin Only)
- `/config addrole <role>` - Add a role that can manage shared posts
- `/config removerole <role>` - Remove a role from managing shared posts
- `/config listroles` - List all roles that can manage shared posts

### Post Management
- `/post create <content>` - Create a new shared post
- `/post edit <post_id> <new_content>` - Edit an existing shared post
- `/post delete <post_id>` - Delete a shared post
- `/post list [channel]` - List all shared posts (optionally filtered by channel)

## How It Works

1. When a shared post is created, the bot sends a message and stores its details in a local SQLite database
2. Any user with the configured roles (or admin permissions) can edit or delete these posts
3. The bot tracks who created and last edited each post
4. All data is stored locally in `./data/bot.db`

## Permissions

The following users can manage shared posts:
- Server Owner
- Users with Administrator permission
- Users with roles added via `/config addrole`

## Project Structure

```
discord-shared-posts-bot/
├── src/
│   ├── bot.ts              # Bot initialization
│   ├── index.ts            # Entry point
│   ├── commands/           # Command handlers
│   ├── database/           # Database models and connection
│   ├── events/             # Discord event handlers
│   └── utils/              # Utility functions
├── data/                   # SQLite database storage
├── .env.example            # Environment variables template
├── package.json            # Project dependencies
└── tsconfig.json           # TypeScript configuration
```

## Troubleshooting

### Bot not responding to commands?
- Ensure the bot has the necessary permissions in your server
- Check that slash commands are registered (may take up to an hour)
- Verify the bot is online and no errors in console

### Database errors?
- Make sure the `data/` directory exists and is writable
- Check console for specific error messages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE