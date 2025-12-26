module.exports = {
  name: "leaderboard",
  async execute(message, args, client) {
    const rows = client.db
      .prepare("SELECT user_id, points FROM users ORDER BY points DESC LIMIT 10")
      .all();

    if (!rows.length)
      return message.reply("No leaderboard data yet.");

    let text = "**🏆 Leaderboard**\n\n";
    for (let i = 0; i < rows.length; i++) {
      const user = await client.users.fetch(rows[i].user_id).catch(() => null);
      text += `${i + 1}. ${user ? user.tag : "Unknown"} – **${rows[i].points}**\n`;
    }

    message.reply(text);
  }
};
