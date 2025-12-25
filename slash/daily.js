const { SlashCommandBuilder } = require("discord.js");
const db = require("../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily points"),

  async execute(interaction) {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    const row = db.prepare(
      "SELECT points, last_daily FROM users WHERE user_id = ?"
    ).get(interaction.user.id);

    if (row && now - row.last_daily < cooldown) {
      const remaining = cooldown - (now - row.last_daily);
      const hours = Math.ceil(remaining / (60 * 60 * 1000));
      return interaction.reply({
        content: `⏳ You can claim daily again in **${hours} hours**.`,
        ephemeral: true
      });
    }

    db.prepare(`
      INSERT INTO users (user_id, points, last_daily)
      VALUES (?, 10, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET points = points + 1, last_daily = ?
    `).run(interaction.user.id, now, now);

    await interaction.reply("🎉 You received **10 daily points**!");
  }
};
