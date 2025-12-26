module.exports = {
  name: "points",
  async execute(message, args, client) {
    const row = client.db
      .prepare("SELECT points FROM users WHERE user_id = ?")
      .get(message.author.id);

    message.reply(`⭐ You have **${row ? row.points : 0} points**`);
  }
};
