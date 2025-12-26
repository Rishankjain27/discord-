module.exports = {
  name: "poll",
  async execute(message, args) {
    const text = args.join(" ");
    if (!text.includes("|"))
      return message.reply("Usage: `$poll Question | Option 1 | Option 2`");

    const parts = text.split("|").map(p => p.trim());
    const question = parts.shift();
    const options = parts.slice(0, 10);

    if (options.length < 2)
      return message.reply("Provide at least 2 options.");

    let pollText = `📊 **${question}**\n\n`;
    const emojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];

    options.forEach((opt, i) => {
      pollText += `${emojis[i]} ${opt}\n`;
    });

    const pollMessage = await message.channel.send(pollText);
    for (let i = 0; i < options.length; i++) {
      await pollMessage.react(emojis[i]);
    }
  }
};
