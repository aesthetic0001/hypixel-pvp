const supportedMethods = ["hypixel", "localhost"]

function getOpponentName(bot, method, message = undefined) {
    if (!supportedMethods.includes(method)) throw new Error("The method is not supported! It should be: " + supportedMethods.toString())
    if (method === "hypixel") {
        bot.opponentNameText = message.toString().split('Opponent: ')[1]
        bot.opponentName = bot.opponentNameText.trim()
        const regex = /\[VIP|MVP|] (.*)/gm;
        const str = `${bot.opponentNameText}`;
        let m;

        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match) => {
                bot.opponentName = match
            });
        }
    } else {
        bot.opponentName = "your ign"
    }
}

module.exports = {
    getOpponentName
}