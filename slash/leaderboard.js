const { SlashCommandBuilder } = require("discord.js");
const Database = require("better-sqlite3");
const db = new Database("database.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show points leaderboard"),

  async execute(interaction) {
    const rows = db.prepare(
      "SELECT user_id, points FROM users ORDER BY points DESC LIMIT 10"
    ).all();

    if (!rows.length) {
      return interaction.reply("No leaderboard data.");
    }

    let text = "**🏆 Leaderboard**\n\n";
    for (let i = 0; i < rows.length; i++) {
      text += `${i + 1}. <@${rows[i].user_id}> — **${rows[i].points}**\n`;
    }

    interaction.reply(text);
  }
};
