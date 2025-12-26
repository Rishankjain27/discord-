if (command === "removepoints") {
  // Permission check
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply("❌ You must be an Administrator to use this command.");
  }

  // Get mentioned user
  const user = message.mentions.users.first();
  if (!user) {
    return message.reply("❌ You must mention a user.\nUsage: `$removepoints @user amount`");
  }

  // Get amount
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount <= 0) {
    return message.reply("❌ Amount must be a valid number.\nUsage: `$removepoints @user amount`");
  }

  // Get current points
  const row = db.prepare(
    "SELECT points FROM users WHERE user_id = ?"
  ).get(user.id);

  if (!row || row.points <= 0) {
    return message.reply("⚠️ That user has no points to remove.");
  }

  const newPoints = Math.max(0, row.points - amount);

  // Update points
  db.prepare(
    "UPDATE users SET points = ? WHERE user_id = ?"
  ).run(newPoints, user.id);

  return message.reply(
    `❌ Removed **${amount} points** from **${user.tag}**.\nNew balance: **${newPoints} points**`
  );
}
