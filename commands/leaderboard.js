const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View leaderboard"),

  async execute(interaction) {
    const users = db
      .prepare("SELECT * FROM users ORDER BY points DESC LIMIT 10")
      .all();

    if (!users.length) {
      return interaction.reply("No data yet.");
    }

    let text = "";
    for (let i = 0; i < users.length; i++) {
      const user = await interaction.client.users.fetch(users[i].user_id);
      text += `**${i + 1}.** ${user.tag} — ${users[i].points} points\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle("🏆 Leaderboard")
      .setDescription(text)
      .setColor(0x5865F2);

    interaction.reply({ embeds: [embed] });
  }
};
