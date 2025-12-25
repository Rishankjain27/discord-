if (command === "ap") {
  // Permission check
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply("❌ You must be an Administrator to use this command.");
  }

  // Get mentioned user
  const user = message.mentions.users.first();
  if (!user) {
    return message.reply("❌ You must mention a user.\nUsage: `$addpoints @user amount`");
  }

  // Get amount
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount <= 0) {
    return message.reply("❌ Amount must be a valid number.\nUsage: `$addpoints @user amount`");
  }

  // Add points
  db.prepare(`
    INSERT INTO users (user_id, points)
    VALUES (?, ?)
    ON CONFLICT(user_id)
    DO UPDATE SET points = points + ?
  `).run(user.id, amount, amount);

  return message.reply(
    `✅ Successfully added **${amount} points** to **${user.tag}**`
  );
}
