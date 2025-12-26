require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  Events
} = require("discord.js");

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
    .setName("ping")
    .setDescription("Slash test command"),

  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Slash daily test")
].map(c => c.toJSON());

/* ================= READY ================= */
client.once(Events.ClientReady, async () => {
  console.log("✅ BOT ONLINE");

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: slashCommands }
  );

  console.log("✅ SLASH COMMANDS REGISTERED");
});

/* ================= SLASH HANDLER ================= */
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    return interaction.reply("🏓 Slash works");
  }

  if (interaction.commandName === "daily") {
    return interaction.reply("🎉 Daily slash works");
  }
});

/* ================= PREFIX HANDLER ================= */
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (message.content === "$ping") {
    return message.reply("🏓 Prefix works");
  }
});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
