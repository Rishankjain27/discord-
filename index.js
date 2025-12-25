require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder
} = require("discord.js");
const Database = require("better-sqlite3");

const PREFIX = "$";

// ================= DATABASE =================
const db = new Database("database.db");
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    points INTEGER DEFAULT 0,
    last_daily INTEGER DEFAULT 0
  )
`).run();

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= READY =================
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ================= MESSAGE HANDLER =================
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ---------- HELP ----------
  if (command === "help") {
    return message.reply(
      "**📘 Commands**\n" +
      "`$points` – Check points\n" +
      "`$daily` – Get daily points\n" +
      "`$leaderboard` – Top users\n" +
      "`$addpoints @user amount` – Admin\n" +
      "`$removepoints @user amount` – Admin\n" +
      "`$delete number` – Delete messages\n" +
      "`$say message` – Bot speaks\n" +
      "`$announce message` – Announcement"
    );
  }

  // ---------- POINTS ----------
  if (command === "points") {
    const row = db.prepare("SELECT points FROM users WHERE user_id = ?")
      .get(message.author.id);
    return message.reply(`⭐ You have **${row ? row.points : 0} points**`);
  }

  // ---------- DAILY ----------
  if (command === "daily") {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const row = db.prepare("SELECT last_daily FROM users WHERE user_id = ?")
      .get(message.author.id);

    if (row && now - row.last_daily < cooldown) {
      const hours = Math.ceil(
        (cooldown - (now - row.last_daily)) / 3600000
      );
      return message.reply(`⏳ Try again in **${hours} hours**`);
    }

    db.prepare(`
      INSERT INTO users (user_id, points, last_daily)
      VALUES (?, 10, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET points = points + 10, last_daily = ?
    `).run(message.author.id, now, now);

    return message.reply("🎉 You received **10 daily points**!");
  }

  // ---------- LEADERBOARD ----------
  if (command === "leaderboard") {
    const rows = db.prepare(
      "SELECT user_id, points FROM users ORDER BY points DESC LIMIT 10"
    ).all();

    if (!rows.length) return message.reply("No leaderboard data.");

    let text = "**🏆 Leaderboard**\n\n";
    for (let i = 0; i < rows.length; i++) {
      const user = await client.users.fetch(rows[i].user_id).catch(() => null);
      text += `${i + 1}. ${user ? user.tag : "Unknown"} – **${rows[i].points}**\n`;
    }

    return message.reply(text);
  }

  // ---------- ADD POINTS ----------
  if (command === "addpoints") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Admin only");

    const user = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!user || isNaN(amount) || amount <= 0)
      return message.reply("Usage: `$addpoints @user amount`");

    db.prepare(`
      INSERT INTO users (user_id, points)
      VALUES (?, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET points = points + ?
    `).run(user.id, amount, amount);

    return message.reply(`✅ Added **${amount} points** to **${user.tag}**`);
  }

  // ---------- REMOVE POINTS ----------
  if (command === "removepoints") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Admin only");

    const user = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!user || isNaN(amount) || amount <= 0)
      return message.reply("Usage: `$removepoints @user amount`");

    const row = db.prepare("SELECT points FROM users WHERE user_id = ?")
      .get(user.id);
    const newPoints = Math.max(0, (row?.points || 0) - amount);

    db.prepare("UPDATE users SET points = ? WHERE user_id = ?")
      .run(newPoints, user.id);

    return message.reply(`❌ Removed points. New balance: **${newPoints}**`);
  }

  // ---------- DELETE ----------
  if (command === "delete") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return message.reply("❌ Missing permission");

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100)
      return message.reply("Usage: `$delete 1-100`");

    await message.channel.bulkDelete(amount, true);
    const msg = await message.channel.send(`🗑 Deleted ${amount} messages`);
    setTimeout(() => msg.delete(), 4000);
  }

  // ---------- SAY ----------
  if (command === "say") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Admin only");

    const text = args.join(" ");
    if (!text) return message.reply("Usage: `$say message`");

    await message.delete();
    message.channel.send(text);
  }

  // ---------- ANNOUNCE ----------
  if (command === "announce") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Admin only");

    const text = args.join(" ");
    if (!text) return message.reply("Usage: `$announce message`");

    const embed = new EmbedBuilder()
      .setTitle("📢 Announcement")
      .setDescription(text)
      .setColor(0xff0000)
      .setTimestamp();

    await message.delete();
    message.channel.send({ embeds: [embed] });
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
