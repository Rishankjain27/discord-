const { SlashCommandBuilder } = require("discord.js");
const db = require("../database");

const DAILY_POINTS = 100;
const COOLDOWN = 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim daily points"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const now = Date.now();

    const user = db
      .prepare("SELECT * FROM users WHERE user_id = ?")
      .get(userId);

    if (!user) {
      db.prepare(
        "INSERT INTO users (user_id, points, last_daily) VALUES (?, ?, ?)"
      ).run(userId, DAILY_POINTS, now);

      return interaction.reply(`You received **${DAILY_POINTS} points**.`);
    }

    if (now - user.last_daily < COOLDOWN) {
      const hours = Math.ceil(
        (COOLDOWN - (now - user.last_daily)) / 3600000
      );
      return interaction.reply({
        content: `Come back in **${hours} hours**.`,
        ephemeral: true
      });
    }

    db.prepare(
      "UPDATE users SET points = points + ?, last_daily = ? WHERE user_id = ?"
    ).run(DAILY_POINTS, now, userId);

    interaction.reply(`You received **${DAILY_POINTS} points**.`);
  }
};
