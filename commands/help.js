module.exports = {
  name: "help",
  async execute(message) {
    message.reply(
      "**📘 Help Menu**\n\n" +
      "`$ping` – Test bot\n" +
      "`$points` – Check points\n" +
      "`$daily` – Daily reward\n" +
      "`$leaderboard` – Top users\n" +
      "`$addpoints @user amount` – Admin\n" +
      "`$removepoints @user amount` – Admin\n" +
      "`$poll question | option1 | option2` – Create poll"
    );
  }
};
