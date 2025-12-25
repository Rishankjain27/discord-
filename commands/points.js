const { SlashCommandBuilder } = require("discord.js");
const db = require("../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("points")
    .setDescription("Check your points"),

  async execute(interaction) {
    const user = db
      .prepare("SELECT points FROM users WHERE user_id = ?")
      .get(interaction.user.id);

    interaction.reply(
      `You have **${user ? user.points : 0} points**.`
    );
  }
};
