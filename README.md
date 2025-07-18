
# Shared Notes Bot

A collaborative Discord bot for managing shared notes in your server. Designed for admins, mods, and teams to create, edit, and organize important information with robust permissions and a modern UX.

---

## 🚦 Permission System Overview

**This bot uses a per-user, per-channel permission system for creating, editing, and deleting notes.**

- Users must be explicitly granted permission for each channel using `/config-grant`.
- Server owners and admins always have full access and can grant permissions.
- Roles can be configured for listing and config commands via `/snote-config`.
- Edit buttons on notes also respect permissions.

See below for details on each command and how permissions work.

---

## Table of Contents
- [Command Summary](#command-summary)
- [Command Details](#command-details)
  - [Create Note](#create-note)
  - [Edit Note](#edit-note)
  - [Delete Note](#delete-note)
  - [List Notes](#list-notes)
  - [Config](#config)
  - [Config Grant](#config-grant)
- [Permissions](#permissions)
- [Database & Data](#database--data)
- [Setup & Running](#setup--running)
- [Contributing](#contributing)

---

## Command Summary

| Command            | Short Alias | Description                                 | Details Link         |
|--------------------|-------------|---------------------------------------------|---------------------|
| `/snote-create`    | `/sn-create`| Create a new shared note                    | [Details](#create-note) |
| `/snote-edit`      | `/sn-edit`  | Edit an existing shared note                | [Details](#edit-note)   |
| `/snote-delete`    | `/sn-delete`| Delete a shared note                        | [Details](#delete-note) |
| `/snote-list`      | `/sn-list`  | List all shared notes                       | [Details](#list-notes)  |
| `/snote-config`    | `/sn-config`| Configure bot settings and permissions      | [Details](#config)      |
| `/config-grant`    |             | Grant a user permission in a channel        | [Details](#config-grant) |

---

## Command Details

### Create Note
- **Command:** `/snote-create` or `/sn-create`
- **Description:** Opens a modal to create a new shared note. You can specify a title, content (supports markdown), and optional tags.
- **Permissions:** User must have been granted permission for the channel (see `/config-grant`).

### Edit Note
- **Command:** `/snote-edit` or `/sn-edit`
- **Description:** Edit an existing note. Use the autocomplete to select a note by title/ID, or click the Edit button on a note message. Opens a modal for editing.
- **Permissions:** User must have been granted permission for the channel (see `/config-grant`).

### Delete Note
- **Command:** `/snote-delete` or `/sn-delete`
- **Description:** Delete a note by ID. Use autocomplete to select the note.
- **Permissions:** User must have been granted permission for the channel (see `/config-grant`).

### List Notes
- **Command:** `/snote-list` or `/sn-list`
- **Description:** List recent shared notes in the server, optionally filtered by channel.
- **Permissions:** Only users with the configured role or admin/owner can view notes.

### Config
- **Command:** `/snote-config` or `/sn-config`
- **Description:** Configure bot settings, including:
  - Set the default channel for notes
  - Create/manage roles for note permissions
  - Assign/remove users to/from note roles
  - List allowed roles
  - Show current configuration
- **Permissions:** Only the server owner can configure settings.

### Config Grant
- **Command:** `/config-grant`
- **Description:** Grant a user permission to create, edit, or delete posts in a specific channel.
- **Usage:**
  - `/config-grant user:@User channel:#channel action:create`
  - `/config-grant user:@User channel:#channel action:edit`
  - `/config-grant user:@User channel:#channel action:delete`
- **Permissions:** Only server owner or admins can grant permissions.

---


## Permissions
- **Per-user, per-channel:** Users must be granted permission for each channel using `/config-grant` to create, edit, or delete posts there.
- **Owner/Admins:** Always have full access to all commands and can grant permissions.
- **Allowed Roles:** Configurable via `/snote-config` to grant note management to specific roles (for listing, etc).
- **Button Actions:** Edit buttons on notes also respect permissions.

---

## Database & Data
- All user data and configuration is stored in `data/database.sqlite` (excluded from git).
- The `data/` folder is used for all persistent data.

---

## Setup & Running
1. **Clone the repo:**
   ```sh
   git clone https://github.com/M1XZG/discord-shared-posts-bot.git
   cd discord-shared-posts-bot
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment:**
   - Copy `.env.example` to `.env` and fill in your Discord bot token and IDs.
4. **Run the bot (development):**
   ```sh
   npm run dev
   ```
5. **Run the bot (production):**
   ```sh
   npm run build
   npm start
   ```

---

## Contributing
Pull requests and suggestions are welcome! Please open an issue or PR for improvements, bug fixes, or new features.

---

*Made with ❤️ for collaborative Discord communities.*