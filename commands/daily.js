module.exports = {
  name: "daily",
  async execute(message, args, client) {
    const db = client.db;
    const now = Date.now();
    const cooldown = 86400000;

    const row = db
      .prepare("SELECT last_daily FROM users WHERE user_id = ?")
      .get(message.author.id);

    if (row && now - row.last_daily < cooldown) {
      const hours = Math.ceil(
        (cooldown - (now - row.last_daily)) / 3600000
      );
      return message.reply(`⏳ Try again in **${hours} hours**`);
    }

    db.prepare(`
      INSERT INTO users (user_id, points, last_daily)
      VALUES (?, 10, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET points = points + 1, last_daily = ?
    `).run(message.author.id, now, now);

    message.reply("🎉 You received **1 daily points**!");
  }
};
