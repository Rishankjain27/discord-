const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all available commands"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("📘 Help Menu")
      .setColor(0x5865f2)
      .setDescription("Here are the available commands:")
      .addFields(
        { name: "/points", value: "Check your points", inline: false },
        { name: "/daily", value: "Get daily points", inline: false },
        { name: "/leaderboard", value: "View top users", inline: false },
        { name: "/addpoints", value: "Add points to a user (Admin)", inline: false },
        { name: "/removepoints", value: "Remove points from a user (Admin)", inline: false },
        { name: "/delete", value: "Delete messages (Moderator)", inline: false },
        { name: "/say", value: "Make the bot say something (Admin)", inline: false },
        { name: "/announce", value: "Send an announcement (Admin)", inline: false }
      )
      .setFooter({ text: "Slash command system" })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
