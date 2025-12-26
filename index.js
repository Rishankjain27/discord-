require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  Events
} = require("discord.js");

const Database = require("better-sqlite3");
const PREFIX = "$";

/* ================= DATABASE ================= */
const db = new Database("database.db");
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    points INTEGER DEFAULT 0,
    last_daily INTEGER DEFAULT 0
  )
`).run();

/* ================= CLIENT ================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* ================= SHARED LOGIC ================= */
function claimDaily(userId) {
  const now = Date.now();
  const cooldown = 86400000;

  const row = db.prepare(
    "SELECT last_daily FROM users WHERE user_id = ?"
  ).get(userId);

  if (row && now - row.last_daily < cooldown) {
    return { ok: false, hours: Math.ceil((cooldown - (now - row.last_daily)) / 3600000) };
  }

  db.prepare(`
    INSERT INTO users (user_id, points, last_daily)
    VALUES (?, 10, ?)
    ON CONFLICT(user_id)
    DO UPDATE SET points = points + 10, last_daily = ?
  `).run(userId, now, now);

  return { ok: true };
}

function getLeaderboard() {
  return db.prepare(
    "SELECT user_id, points FROM users ORDER BY points DESC LIMIT 10"
  ).all();
}

/* ================= SLASH COMMANDS ================= */
const slashCommands = [
  new SlashCommandBuilder().setName("daily").setDescription("Claim daily points"),
  new SlashCommandBuilder().setName("leaderboard").setDescription("View leaderboard")
].map(c => c.toJSON());

client.once(Events.ClientReady, async () => {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: slashCommands }
  );

  console.log("✅ Bot online + slash commands registered");
});

/* ================= SLASH HANDLER ================= */
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "daily") {
    const result = claimDaily(interaction.user.id);
    return result.ok
      ? interaction.reply("🎉 You received **10 daily points**!")
      : interaction.reply({ content: `⏳ Try again in **${result.hours} hours**`, ephemeral: true });
  }

  if (interaction.commandName === "leaderboard") {
    const rows = getLeaderboard();
    if (!rows.length) return interaction.reply("No data yet.");

    let text = "**🏆 Leaderboard**\n\n";
    for (let i = 0; i < rows.length; i++) {
      const user = await client.users.fetch(rows[i].user_id).catch(() => null);
      text += `${i + 1}. ${user ? user.tag : "Unknown"} – **${rows[i].points}**\n`;
    }
    interaction.reply(text);
  }
});

/* ================= PREFIX HANDLER ================= */
client.on("messageCreate", async message => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "daily") {
    const result = claimDaily(message.author.id);
    return message.reply(
      result.ok
        ? "🎉 You received **10 daily points**!"
        : `⏳ Try again in **${result.hours} hours**`
    );
  }

  if (command === "leaderboard") {
    const rows = getLeaderboard();
    if (!rows.length) return message.reply("No data yet.");

    let text = "**🏆 Leaderboard**\n\n";
    for (let i = 0; i < rows.length; i++) {
      const user = await client.users.fetch(rows[i].user_id).catch(() => null);
      text += `${i + 1}. ${user ? user.tag : "Unknown"} – **${rows[i].points}**\n`;
    }
    return message.reply(text);
  }

  if (co
