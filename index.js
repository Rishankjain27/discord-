require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  Events
} = require("discord.js");

const Database = require("better-sqlite3");

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
  intents: [GatewayIntentBits.Guilds]
});

/* ================= SLASH COMMANDS ================= */
const commands = [
  new SlashCommandBuilder().setName("help").setDescription("Show all commands"),

  new SlashCommandBuilder().setName("points").setDescription("Check your points"),

  new SlashCommandBuilder().setName("daily").setDescription("Get daily points"),

  new SlashCommandBuilder().setName("leaderboard").setDescription("Top users"),

  new SlashCommandBuilder()
    .setName("addpoints")
    .setDescription("Add points to a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("Amount").setRequired(true)),

  new SlashCommandBuilder()
    .setName("removepoints")
    .setDescription("Remove points from a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addIntegerOption(o => o.setName("amount").setDescription("Amount").setRequired(true)),

  new SlashCommandBuilder()
    .setName("delete")
    .setDescription("Delete messages")
    .addIntegerOption(o =>
      o.setName("amount").setDescription("1-100").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Bot sends a message")
    .addStringOption(o =>
      o.setName("text").setDescription("Message").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Announcement message")
    .addStringOption(o =>
      o.setName("text").setDescription("Announcement").setRequired(true)
    )
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
    { body: commands }
  );

  console.log("✅ Slash commands registered");
});

/* ================= INTERACTIONS ================= */
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  /* HELP */
  if (commandName === "help") {
    return interaction.reply({
      content:
        "**📘 Commands**\n" +
        "/points\n/daily\n/leaderboard\n/addpoints\n/removepoints\n/delete\n/say\n/announce",
      ephemeral: true
    });
  }

  /* POINTS */
  if (commandName === "points") {
    const row = db.prepare("SELECT points FROM users WHERE user_id = ?")
      .get(interaction.user.id);

    return interaction.reply(`⭐ You have **${row ? row.points : 0} points**`);
  }

  /* DAILY */
  if (commandName === "daily") {
    const now = Date.now();
    const cooldown = 86400000;
    const row = db.prepare("SELECT last_daily FROM users WHERE user_id = ?")
      .get(interaction.user.id);

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

  /* LEADERBOARD */
  if (commandName === "leaderboard") {
    const rows = db.prepare(
      "SELECT user_id, points FROM users ORDER BY points DESC LIMIT 10"
    ).all();

    let text = "**🏆 Leaderboard**\n\n";
    for (let i = 0; i < rows.length; i++) {
      const user = await client.users.fetch(rows[i].user_id).catch(() => null);
      text += `${i + 1}. ${user ? user.tag : "Unknown"} – **${rows[i].points}**\n`;
    }

    return interaction.reply(text);
  }

  /* ADD POINTS */
  if (commandName === "addpoints") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });

    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    db.prepare(`
      INSERT INTO users (user_id, points)
      VALUES (?, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET points = points + ?
    `).run(user.id, amount, amount);

    return interaction.reply(`✅ Added **${amount} points** to **${user.tag}**`);
  }

  /* REMOVE POINTS */
  if (commandName === "removepoints") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });

    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    const row = db.prepare("SELECT points FROM users WHERE user_id = ?").get(user.id);
    const newPoints = Math.max(0, (row?.points || 0) - amount);

    db.prepare("UPDATE users SET points = ? WHERE user_id = ?")
      .run(newPoints, user.id);

    return interaction.reply(`❌ New balance: **${newPoints}**`);
  }

  /* DELETE */
  if (commandName === "delete") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return interaction.reply({ content: "❌ Missing permission", ephemeral: true });

    const amount = interaction.options.getInteger("amount");
    await interaction.channel.bulkDelete(amount, true);

    return interaction.reply({ content: `🗑 Deleted ${amount} messages`, ephemeral: true });
  }

  /* SAY */
  if (commandName === "say") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });

    interaction.channel.send(interaction.options.getString("text"));
    return interaction.reply({ content: "✅ Sent", ephemeral: true });
  }

  /* ANNOUNCE */
  if (commandName === "announce") {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle("📢 Announcement")
      .setDescription(interaction.options.getString("text"))
      .setColor(0xff0000)
      .setTimestamp();

    interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: "✅ Announced", ephemeral: true });
  }
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
