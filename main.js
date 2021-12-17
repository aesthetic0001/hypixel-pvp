const mineflayer = require("mineflayer")
const {Vec3} = require("vec3");
const {getOpponentName} = require("./src/utils/getIgn");
const {authenticate, queue} = require("./src/utils/authenticate");
const {isBlockInFront} = require("./src/utils/blocks");
const PI = Math.PI
const PI_2 = Math.PI * 2

const bot = mineflayer.createBot({
    username: "",
    password: "",
    version: "1.8.9",
    auth: "mojang",
    host: "mc.hypixel.net",
    port: 25565
})

function deltaYaw(yaw1, yaw2) {
    let dYaw = (yaw1 - yaw2) % PI_2
    if (dYaw < -PI) dYaw += PI_2
    else if (dYaw > PI) dYaw -= PI_2

    return dYaw
}

const sleep = async (ms) => {
    await new Promise(res => {
        setTimeout(() => {
            res(0)
        }, ms)
    })
}

// up to 4.5 block reach seems to be fine
const botReach = 3.5
const minDelayAttack = 20
// only use localhost for testing
const method = "hypixel"
const mode = "sumo"
const hitSync = false

bot.opponentInvulnerable = false
bot.opponentName = false
bot.currentTarget = null
bot.currentDirection = null
bot.shouldFight = false
bot.shouldStrafe = false
bot.shouldBeAbleToPunch = true

const lastLook = {
    lastYaw: 0,
    lastPitch: 0
}

async function duel() {
    return new Promise(async (resolve) => {
        console.log("Dueling")
        await sleep(250)
        await queue(bot, method, mode)
        lastLook.lastYaw = bot.entity.yaw
        lastLook.lastPitch = bot.entity.pitch
        bot.setQuickBarSlot(0)
        bot.once("doneMatch", () => {
            bot.shouldFight = false
            bot.currentTarget = false
            goingRight = false
            bot.opponentName = false
            bot.chat("gg")
            bot.clearControlStates()
            resolve()
        })
    })
}

function isValidMove() {
    const entityAtCursor = bot.entityAtCursor(botReach)
    const currentCurUser = entityAtCursor ? entityAtCursor.username : "null"
    return bot.opponentName === currentCurUser
}

let goingRight = false

async function doStrafe(simpleStrafe = mode === "sumo") {
    if (bot.currentTarget && bot.shouldStrafe) {
        if (simpleStrafe) {
            if (goingRight) {
                bot.setControlState('left', false)
                bot.setControlState('right', true)
            } else {
                bot.setControlState('right', false)
                bot.setControlState('left', true)
            }
            goingRight = !goingRight
            await sleep(200)
            return await doStrafe()
        } else {
            const staringDirection = Math.sign(deltaYaw(bot.entity.yaw, bot.currentTarget.yaw)) === 1 ? "right" : "left"
            if (bot.currentDirection) {
                if (staringDirection !== bot.currentDirection) {
                    bot.setControlState(bot.currentDirection, false)
                }
            }
            bot.setControlState(staringDirection, true)
            bot.currentDirection = staringDirection
        }
    } else {
        if (bot.currentDirection !== null) {
            bot.setControlState(bot.currentDirection, false)
            bot.currentDirection = null
        }
    }
    await sleep(20)
    await doStrafe()
}

async function doPunch() {
    if (bot.currentTarget && isValidMove()) {
        if (hitSync && bot.opponentInvulnerable) {
            await sleep(Math.random() * 5 + minDelayAttack)
            return await doPunch()
        }
        if (isValidMove() && bot.entity.position.distanceTo(bot.currentTarget.position) <= botReach) {
            const shouldTap = bot.entity.position.distanceTo(bot.currentTarget.position) <= 3 || mode === "sumo" && !bot.opponentInvulnerable
            if (shouldTap) {
                bot.setControlState('sprint', false)
                bot.setControlState('sprint', true)
            }
            bot._client.write("arm_animation", {})
            bot._client.write("use_entity", {
                target: bot.currentTarget.id,
                mouse: 1
            })
        }
    }
    await sleep(Math.random() * 5 + minDelayAttack)
    await doPunch()
}

bot.on("physicsTick", () => {
    if (bot.shouldFight) {
        bot.currentTarget = bot.nearestEntity((entity) => {
            if (entity.type === "player" && entity.position.y - bot.entity.position.y <= 1) {
                if (entity.username === bot.opponentName) {
                    bot.currentTarget = entity
                    return true
                }
            }
        })
    } else if (bot.currentTarget && !bot.shouldFight) {
        bot.currentTarget = false
    }
})

bot.on("entityMoved", (entity) => {
    if (entity.username === bot.opponentName) {
        if (!isValidMove() && bot.currentTarget) {
            bot.lookAt(bot.currentTarget.position.offset(Math.random() * 0.1, 1.5 + Math.random() * 0.01, Math.random() * 0.1), false)
        }
    }
})

bot.once("spawn", async () => {
    console.log("Queueing for " + mode)

    if (method === "localhost") {
        getOpponentName(bot, method)
        bot.shouldFight = true
    }

    await sleep(1000)

    doStrafe()
    doPunch()

    await authenticate(bot, method)

    console.log("Authenticated")

    for (let i = 0; i < 999; i++) {
        await duel()
        await sleep(3500)
    }
})

bot.on("error", console.log)

bot.on("kicked", console.log)

bot.on("message", async (message) => {
    console.log(message.toAnsi())
    if (message.toString().startsWith("Something went wrong trying to send you to that server! If this keeps happening please report it!") || message.toString().startsWith("There are no servers running that mode right now! Try again in a moment!")) {
        await sleep(5000)
        bot.chat(`/play duels_${mode}_duel`)
    }
    if (message.toString().includes('Opponent: ') || message.toString().startsWith("The match is starting in 3 seconds.")) {
        bot.setControlState("sprint", true)
        bot.shouldFight = true
        getOpponentName(bot, method, message)
    }
    if (message.toString().includes(bot.username) && bot.shouldFight) {
        bot.emit("doneMatch")
    }
})

bot.on("physicsTick", async () => {
    if (bot.currentTarget) {
        if (!isValidMove()) {
            bot.lookAt(bot.currentTarget.position.offset(Math.random() * 0.1, 1.5 + Math.random() * 0.01, Math.random() * 0.1), false)
        }
    }
})

bot._client.on("entity_status", (packet) => {
    if (!bot.currentTarget) return
    if (packet.entityId === bot.currentTarget.id && packet.entityStatus === 2) {
        bot.opponentInvulnerable = true
        setTimeout(() => {
            bot.opponentInvulnerable = false
        }, 500)
    }
})

bot.on("move", () => {
    if (!isValidMove() && bot.currentTarget) {
        bot.lookAt(bot.currentTarget.position.offset(Math.random() * 0.1, 1.5 + Math.random() * 0.01, Math.random() * 0.1), false)
    }
    if (bot.currentTarget) {
        if (isBlockInFront(bot) && bot.shouldFight || (bot.currentTarget.position.xzDistanceTo(bot.entity.position) >= 8 && !bot.entity.position.xzDistanceTo(bot.currentTarget.position) <= 5)) {
            bot.setControlState("jump", true)
        } else bot.setControlState("jump", false)

        bot.shouldStrafe = bot.entity.position.distanceTo(bot.currentTarget.position) <= botReach + 0.5;

        if (bot.blockAt(bot.currentTarget.position.offset(0, -2, 0)).displayName === "Air" && bot.blockAt(bot.currentTarget.position.offset(0, -1, 0)).displayName === "Air") {
            bot.setControlState('forward', false)
        } else {
            bot.setControlState('sprint', true)
            bot.setControlState('forward', true)
        }

        if (bot.entity.position.distanceTo(bot.currentTarget.position) <= 1.5 && mode === "boxing" && bot.getControlState('forward')) {
            bot.setControlState("back", true)
        } else {
            bot.setControlState('back', false)
        }
        if (mode === "sumo") {
            const block = bot.blockAt(bot.entity.position.offset(1, -1, 0))
            const block1 = bot.blockAt(bot.entity.position.offset(-1, -1, 0))
            const block2 = bot.blockAt(bot.entity.position.offset(0, -1, 1))
            const block3 = bot.blockAt(bot.entity.position.offset(0, -1, -1))
            const block4 = bot.blockAt(bot.entity.position.offset(0, -1, 2))
            const block5 = bot.blockAt(bot.entity.position.offset(2, -1, 0))
            const block6 = bot.blockAt(bot.entity.position.offset(0, -1, -2))
            const block7 = bot.blockAt(bot.entity.position.offset(-2, -1, 0))
            const block8 = bot.blockAt(bot.entity.position.offset(2, -1, 2))
            const block9 = bot.blockAt(bot.entity.position.offset(-2, -1, 2))
            const block10 = bot.blockAt(bot.entity.position.offset(2, -1, -2))
            const block11 = bot.blockAt(bot.entity.position.offset(-2, -1, -2))

            if (block.displayName === 'Air' || block1.displayName === 'Air' || block2.displayName === 'Air' || block3.displayName === 'Air' || block4.displayName === 'Air' || block5.displayName === 'Air' || block6.displayName === 'Air' || block7.displayName === 'Air' || block8.displayName === 'Air' || block9.displayName === 'Air' || block10.displayName === 'Air' || block11.displayName === 'Air') {
                bot.setControlState('left', false)
                bot.setControlState('right', false)
            }
        }
    }
})