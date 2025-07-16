# Discord Shared Posts Bot

A Discord bot that solves the long-standing limitation where only the original message author can edit their posts. This bot allows server owners to designate specific users who can create, edit, and manage shared posts collaboratively.

## 🚀 Features

- **Collaborative Post Management**: Multiple authorized users can edit the same posts
- **Flexible Permissions**: Server owner controls who can manage posts
- **Role Creation**: Automatically create and configure roles with proper permissions
- **Channel-Specific**: Configure a dedicated channel for shared posts
- **Database Storage**: All posts are tracked locally using SQLite
- **Edit History**: Tracks who created and last edited each post
- **Simple Commands**: Intuitive slash commands for all operations

## 📋 Prerequisites

- Node.js (version 16.9.0 or higher)
- npm or yarn
- A Discord Bot Token ([Create one here](https://discord.com/developers/applications))
- A Discord server where you have owner permissions

## 🛠️ Installation

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

## 🤖 Running the Bot

### Production:
```bash
npm start
```

### Development (with auto-reload):
```bash
npm run dev
```

## ⚙️ Initial Setup (Server Owner Only)

1. **Invite the bot** to your server with these permissions:
   - Send Messages
   - Manage Messages
   - Manage Roles
   - Use Slash Commands
   - Read Message History
   - Embed Links

2. **Configure the shared posts channel**:
   ```
   /config setchannel #shared-notes
   ```

3. **Create a role for post managers** (optional - adds up to 3 users):
   ```
   /config createrole name:"Note Editors" user1:@john user2:@jane user3:@alex
   ```

4. **Add more users to the role later**:
   ```
   /config assignrole role:@Note-Editors user:@newuser action:Add
   ```

## 📝 Commands

### Configuration Commands (Server Owner Only)

| Command | Description |
|---------|-------------|
| `/config setchannel <channel>` | Set the default channel for shared posts |
| `/config createrole [name] [user1] [user2] [user3]` | Create a role with permissions and optionally assign users |
| `/config assignrole <role> <user> <action>` | Add or remove users from a configured role |
| `/config addrole <role>` | Add an existing role to manage shared posts |
| `/config removerole <role>` | Remove a role from managing shared posts |
| `/config listroles` | List all roles that can manage shared posts |
| `/config info` | Show current bot configuration |

### Post Management Commands (Authorized Users)

| Command | Description |
|---------|-------------|
| `/createpost <content>` | Create a new shared post |
| `/editpost <id> <content>` | Edit an existing shared post |
| `/deletepost <id>` | Delete a shared post |
| `/listposts [channel]` | List all shared posts (optionally filtered by channel) |

## 🔐 Permissions System

### Who can configure the bot:
- **Server Owner only** - Has exclusive access to all `/config` commands

### Who can manage shared posts:
- Server Owner (always)
- Users with Administrator permission (always)
- Users with roles configured via `/config addrole` or `/config createrole`

## 💡 Usage Example

1. **Server owner** sets up the bot:
   ```
   /config setchannel #community-notes
   /config createrole name:"Community Editors" user1:@alice user2:@bob
   ```

2. **Authorized users** create shared posts:
   ```
   /createpost content:"Meeting notes: We discussed the upcoming event..."
   ```

3. **Any authorized user** can edit:
   ```
   /editpost id:1 content:"Meeting notes: We discussed the upcoming event on July 20th..."
   ```

4. **View all posts**:
   ```
   /listposts
   ```

## 📁 Project Structure

```
discord-shared-posts-bot/
├── src/
│   ├── bot.ts                 # Bot initialization
│   ├── index.ts               # Entry point
│   ├── commands/              # Command handlers
│   │   ├── config.ts          # Configuration commands
│   │   ├── createPost.ts      # Create posts
│   │   ├── editPost.ts        # Edit posts
│   │   ├── deletePost.ts      # Delete posts
│   │   └── listPosts.ts       # List posts
│   ├── database/              # Database setup
│   │   ├── connection.ts      # Database connection
│   │   └── models/            # Data models
│   │       ├── Post.ts        # Post model
│   │       └── ServerConfig.ts # Server configuration model
│   ├── events/                # Discord event handlers
│   │   ├── ready.ts           # Bot ready event
│   │   └── interactionCreate.ts # Command interactions
│   └── utils/                 # Utility functions
│       ├── permissions.ts     # Permission checking
│       └── registerCommands.ts # Command registration
├── data/                      # SQLite database storage (created automatically)
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore file
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## 🔧 Troubleshooting

### Bot not responding to commands?
- Ensure the bot has all required permissions
- Check that you've set up a channel with `/config setchannel`
- Verify the bot is online and check console for errors
- Commands may take up to an hour to register globally (use `DEV_GUILD_ID` for instant updates)

### Permission denied errors?
- Make sure you're the server owner when using `/config` commands
- Check that your role is added with `/config addrole` or created with `/config createrole`
- Verify the bot has "Manage Roles" permission to assign roles

### Database errors?
- Ensure the `data/` directory exists and is writable
- Check console for specific error messages
- The database file (`data/bot.db`) is created automatically on first run

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [discord.js](https://discord.js.org/)
- Uses [Sequelize](https://sequelize.org/) ORM with SQLite
- Written in TypeScript