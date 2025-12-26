const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "removepoints",
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Admin only");

    const user = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!user || isNaN(amount) || amount <= 0)
      return message.reply("Usage: `$removepoints @user amount`");

    const row = client.db
      .prepare("SELECT points FROM users WHERE user_id = ?")
      .get(user.id);

    const newPoints = Math.max(0, (row?.points || 0) - amount);

    client.db
      .prepare("UPDATE users SET points = ? WHERE user_id = ?")
      .run(newPoints, user.id);

    message.reply(`❌ New balance for ${user.tag}: **${newPoints}**`);
  }
};
