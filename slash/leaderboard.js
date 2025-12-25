const { SlashCommandBuilder } = require("discord.js");
const db = require("../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View top users by points"),

  async execute(interaction) {
    const rows = db.prepare(
      "SELECT user_id, points FROM users ORDER BY points DESC LIMIT 10"
    ).all();

    if (rows.length === 0) {
      return interaction.reply("No leaderboard data yet.");
    }

    let text = "**🏆 Leaderboard**\n\n";

    for (let i = 0; i < rows.length; i++) {
      const user = await interaction.client.users
        .fetch(rows[i].user_id)
        .catch(() => null);

      text += `${i + 1}. ${user ? user.tag : "Unknown User"} — **${rows[i].points}** points\n`;
    }

    await interaction.reply(text);
  }
};
