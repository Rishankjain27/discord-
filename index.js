require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const db = require("./database");

const PREFIX = "$";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= READY =================
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Load slash commands
  client.slashCommands = new Map();
  const slashFiles = fs.readdirSync("./slash").filter(file => file.endsWith(".js"));

  for (const file of slashFiles) {
    const command = require(`./slash/${file}`);
    client.slashCommands.set(command.data.name, command);
    console.log(`Loaded slash command: /${command.data.name}`);
  }
});

// ================= PREFIX COMMANDS =================
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ----- $help -----
  if (command === "help") {
    return message.reply(
      "**Commands:**\n" +
      "`$help` → Show this message\n" +
      "`$daily` → Claim daily points\n" +
      "`$leaderboard` → Show top users\n" +
      "`$points` → Check your points\n" +
      "`$addpoints @user amount` → Add points (Admin)\n" +
      "`$removepoints @user amount` → Remove points (Admin)\n" +
      "`$delete <number>` → Delete messages (Admin)\n\n" +
      "**Slash Commands:**\n" +
      "`/daily`\n" +
      "`/leaderboard`"
    );
  }

  // ----- $points -----
  if (command === "points") {
    const row = db.prepare("SELECT points FROM users WHERE user_id = ?").get(message.author.id);
    return message.reply(`You have **${row ? row.points : 0} points**.`);
  }

  // ----- $daily -----
  if (command === "daily") {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const row = db.prepare("SELECT last_daily FROM users WHERE user_id = ?").get(message.author.id);

    if (row && now - row.last_daily < cooldown) {
      const hours = Math.ceil((cooldown - (now - row.last_daily)) / (60 * 60 * 1000));
      return message.reply(`⏳ Try again in **${hours} hours**.`);
    }

    db.prepare(`
      INSERT INTO users (user_id, points, last_daily)
      VALUES (?, 10, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET points = points + 10, last_daily = ?
    `).run(message.author.id, now, now);

    return message.reply("🎉 You received **10 daily points**!");
  }

  // ----- $leaderboard -----
  if (command === "leaderboard") {
    const rows = db.prepare("SELECT user_id, points FROM users ORDER BY points DESC LIMIT 10").all();
    if (!rows.length) return message.reply("No leaderboard data.");

    let text = "**🏆 Leaderboard**\n\n";
    for (let i = 0; i < rows.length; i++) {
      const user = await client.users.fetch(rows[i].user_id).catch(() => null);
      text += `${i + 1}. ${user ? user.tag : "Unknown"} — **${rows[i].points} points**\n`;
    }
    return message.reply(text);
  }

  // ----- $addpoints -----
  if (command === "addpoints") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Admin only.");
    }

    const user = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!user || isNaN(amount) || amount <= 0) {
      return message.reply("Usage: `$addpoints @user amount`");
    }

    db.prepare(`
      INSERT INTO users (user_id, points)
      VALUES (?, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET points = points + ?
    `).run(user.id, amount, amount);

    return message.reply(`✅ Added **${amount} points** to **${user.tag}**`);
  }

  // ----- $removepoints -----
  if (command === "removepoints") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Admin only.");
    }

    const user = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!user || isNaN(amount) || amount <= 0) {
      return message.reply("Usage: `$removepoints @user amount`");
    }

    const row = db.prepare("SELECT points FROM users WHERE user_id = ?").get(user.id);
    const newPoints = Math.max(0, (row?.points || 0) - amount);

    db.prepare("UPDATE users SET points = ? WHERE user_id = ?").run(newPoints, user.id);

    return message.reply(
      `❌ Removed **${amount} points** from **${user.tag}**.\nNew balance: **${newPoints} points**`
    );
  }

  // ----- $delete -----
  if (command === "delete") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply("❌ You need the 'Manage Messages' permission to use this.");
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0 || amount > 100) {
      return message.reply("❌ Please provide a number between 1 and 100.\nUsage: `$delete 10`");
    }

    await message.channel.bulkDelete(amount, true)
      .then(deleted => {
        message.channel.send(`✅ Deleted ${deleted.size} messages.`)
          .then(msg => setTimeout(() => msg.delete(), 5000));
      })
      .catch(err => {
        console.error(err);
        message.reply("❌ Cannot delete messages older than 14 days or due to permissions.");
      });
  }
});

// ================= SLASH COMMANDS =================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "Error occurred.", ephemeral: true });
    } else {
      await interaction.reply({ content: "Error occurred.", ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
