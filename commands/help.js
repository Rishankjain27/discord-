// ---------- HELP ----------
if (command === "help") {
  await message.reply(
    "**📘 Bot Commands Help**\n\n" +

    "**🎯 Points System**\n" +
    "`$points` → Check your points\n" +
    "`$daily` → Claim daily points\n" +
    "`$leaderboard` → View top users\n\n" +

    "**🛠 Admin Commands**\n" +
    "`$addpoints @user amount` → Add points\n" +
    "`$removepoints @user amount` → Remove points\n" +
    "`$delete number` → Delete messages\n\n" +

    "**📢 Messaging & Announcements**\n" +
    "`$say message` → Bot sends a message\n" +
    "`$announce message` → Announcement embed\n"
  );
  return; // 🔴 VERY IMPORTANT
}
