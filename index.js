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

/* ================= SLASH COMMANDS ================= */
const slashCommands = [
  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim daily points"),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View top users")
].map(cmd => cmd.toJSON());

/* ================= READY ================= */
client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: slashCommands }
  );

  console.log("✅ Slash commands registered");
});

/* ================= SLASH HANDLER ================= */
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  /* ----- DAILY ----- */
  if (interaction.commandName === "daily") {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    const row = db.prepare(
      "SELECT last_daily FROM users WHERE user_id = ?"
    ).get(interaction.user.id);

    if (row && now - row.last_daily < cooldown) {
      const hours = Math.ceil(
        (cooldown - (now - row.last_daily)) / 3600000
      );
      return interaction.reply({
        content: `⏳ Try again in **${hours} hours**`,
        ephemeral: true
      });
    }

    db.prepare(`
      INSERT INTO users (user_id, points, last_daily)
      VALUES (?, 10, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET points = points + 10, last_daily = ?
    `).run(interaction.user.id, now, now);

    return interaction.reply("🎉 You received **10 daily points**!");
  }

  /* ----- LEADERBOARD ----- */
  if (interaction.commandName === "leaderboard") {
    const rows = db.prepare(
      "SELECT user_id, points FROM users ORDER BY points DESC LIMIT 10"
    ).all();

    if (!rows.length)
      return interaction.reply("No leaderboard data yet.");

    let text = "**🏆 Leaderboard**\n\n";
    for (let i = 0; i < rows.length; i++) {
      const user = await client.users.fetch(rows[i].user_id).catch(() => null);
      text += `${i + 1}. ${user ? user.tag : "Unknown"} – **${rows[i].points}**\n`;
    }

    return interaction.reply(text);
  }
});

/* ================= PREFIX HANDLER ================= */
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  /* ----- HELP ----- */
  if (command === "help") {
    return message.reply(
      "**📘 Commands**\n" +
      "`/dai
