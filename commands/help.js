const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all bot commands and how to use them"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("🤖 Bot Help Menu")
      .setColor(0x5865F2)
      .setDescription("Below are all available commands and their usage.")
      .addFields(
        {
          name: "📊 Points System",
          value:
            "`/daily` → Claim daily points (24h cooldown)\n" +
            "`/points` → Check your points\n" +
            "`/leaderboard` → View top users",
        },
        {
          name: "🛠️ Admin Commands",
          value:
            "`/addpoints user amount` → Add points (Admin only)\n" +
            "`/removepoints user amount` → Remove points (Admin only)",
        },
        {
          name: "⚙️ Utility",
          value:
            "`/ping` → Bot status check\n" +
            "`/help` → Show this help menu",
        }
      )
      .setFooter({
        text: "Use slash commands starting with /",
      });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
