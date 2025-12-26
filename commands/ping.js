const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping test"),

  async execute(interaction) {
    interaction.reply("Pong!");
  }
};
