if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
  return message.reply("❌ Admin only command.");
}
// ---------- POLL ----------
if (command === "poll") {
  const question = args.join(" ");
  if (!question) {
    return message.reply("❌ Usage: `$poll your question here`");
  }

  const embed = new EmbedBuilder()
    .setTitle("📊 Poll")
    .setDescription(question)
    .setColor(0x00bfff)
    .setFooter({ text: `Poll by ${message.author.tag}` })
    .setTimestamp();

  await message.delete(); // remove command message
  const pollMessage = await message.channel.send({ embeds: [embed] });

  await pollMessage.react("👍");
  await pollMessage.react("👎");

  return;
}
