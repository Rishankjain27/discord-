require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  Collection,
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

client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.db = db;

/* ================= LOAD SLASH COMMANDS ================= */
const slashPath = path.join(__dirname, "commands/slash");
const slashFiles = fs.readdirSync(slashPath).filter(f => f.endsWith(".js"));

const slashData = [];

for (const file of slashFiles) {
  const command = require(`${slashPath}/${file}`);
  client.slashCommands.set(command.data.name, command);
  slashData.push(command.data.toJSON());
}

/* ================= LOAD PREFIX COMMANDS ================= */
const prefixPath = path.join(__dirname, "commands/prefix");
const prefixFiles = fs.readdirSync(prefixPath).filter(f => f.endsWith(".js"));

for (const file of prefixFiles) {
  const command = require(`${prefixPath}/${file}`);
  client.prefixCommands.set(command.name, command);
}

/* ================= READY ================= */
client.once(Events.ClientReady, async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: slashData }
  );

  console.log("✅ Slash commands registered");
});

/* ================= SLASH HANDLER ================= */
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  await command.execute(interaction, client);
});

/* ================= PREFIX HANDLER ================= */
client.on("messageCreate", async message => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();

  const command = client.prefixCommands.get(cmdName);
  if (!command) return;

  await command.execute(message, args, client);
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
