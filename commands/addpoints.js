const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "addpoints",
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Admin only");

    const user = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!user || isNaN(amount) || amount <= 0)
      return message.reply("Usage: `$addpoints @user amount`");

    client.db.prepare(`
      INSERT INTO users (user_id, points)
      VALUES (?, ?)
      ON CONFLICT(user_id)
      DO UPDATE SET points = points + ?
    `).run(user.id, amount, amount);

    message.reply(`✅ Added **${amount} points** to ${user.tag}`);
  }
};
