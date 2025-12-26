require("dotenv").config();
const fs = require("fs");
const { REST, Routes } = require("discord.js");

const commands = [];
const commandFiles = fs.readdirSync("./slash").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./slash/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("⏳ Deploying slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash commands deployed!");
  } catch (error) {
    console.error(error);
  }
})();
