const {acceptedModes, supportedMethods} = require("./acceptedModes")
const {Mode} = require("../constructors/Mode")

let modes = []

async function authenticate(bot, method) {
    return new Promise(async (resolve) => {
        if (!supportedMethods.includes(method)) {
            throw new Error("The method is not supported! It should be: " + supportedMethods.toString())
        }
        modes.push(new Mode("boxing", "box people to death", async () => {
            return new Promise(resolve => {
                bot.once("spawn", () => {
                    resolve()
                })
                bot.chat("/play duels_boxing_duel")
            })
        }, async () => {
            resolve()
        }))
        modes.push(new Mode("sumo", "hit people off", async () => {
            return new Promise(resolve => {
                bot.once("spawn", () => {
                    resolve()
                })
                bot.chat("/play duels_sumo_duel")
            })
        }, async () => {
            resolve()
        }))
        modes.push(new Mode("classic", "bows n rod", async () => {
            return new Promise(resolve => {
                bot.once("spawn", () => {
                    resolve()
                })
                bot.chat("/play duels_classic_duel")
            })
        }, async () => {
            resolve()
        }))
        if (method === "hypixel" || method === "localhost") return resolve()
    })
}

async function queue(bot, method, mode) {
    return new Promise((resolve) => {
        if (!supportedMethods.includes(method)) throw new Error("The method is not supported! It should be: " + supportedMethods.toString())
        if (!acceptedModes.includes(mode)) throw new Error("This mode is not yet supported :(. Please choose from " + acceptedModes.toString())

        modes.forEach(async (Mode) => {
            if (Mode.name === mode) {
                await Mode[method]()
                resolve()
            }
        })
    })
}

module.exports = {
    authenticate,
    queue
}
