const { SlashCommandBuilder } = require("discord.js");
const db = require("../database");

const DAILY_POINTS = 1;
const COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily points"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const now = Date.now();

    const user = db
      .prepare("SELECT * FROM users WHERE user_id = ?")
      .get(userId);

    // First-time user
    if (!user) {
      db.prepare(
        "INSERT INTO users (user_id, points, last_daily) VALUES (?, ?, ?)"
      ).run(userId, DAILY_POINTS, now);

      return interaction.reply(
        `✅ You claimed **${DAILY_POINTS} points**. Come back in **24h 0m 0s**.`
      );
    }

    const elapsed = now - user.last_daily;

    // Cooldown not finished
    if (elapsed < COOLDOWN) {
      const remaining = COOLDOWN - elapsed;

      return interaction.reply({
        content: `⏳ Come back in **${formatTime(remaining)}**.`,
        ephemeral: true
      });
    }

    // Cooldown finished
    db.prepare(
      "UPDATE users SET points = points + ?, last_daily = ? WHERE user_id = ?"
    ).run(DAILY_POINTS, now, userId);

    interaction.reply(
      `🎉 You claimed **${DAILY_POINTS} points**. Come back in **24h 0m 0s**.`
    );
  }
};
