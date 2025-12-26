require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
} = require("discord.js");

const fs = require("fs");
const path = require("path");

/* Create client */
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

/* Command collection */
client.commands = new Collection();

/* Load command files */
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(
      `[WARNING] The command at ${filePath} is missing "data" or "execute".`
    );
  }
}

/* Bot ready */
client.once(Events.ClientReady, client => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

/* Slash command handler */
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(
      `❌ No command matching ${interaction.commandName} was found.`
    );
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "⚠️ There was an error while executing this command.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "⚠️ There was an error while executing this command.",
        ephemeral: true,
      });
    }
  }
});

/* Login */
client.login(process.env.DISCORD_TOKEN);
