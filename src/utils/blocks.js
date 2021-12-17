const {Vec3} = require("vec3");

function isBlockInFront(bot) {
    const {yaw, pitch, position} = bot.entity
    const vector = getViewVector(pitch, yaw)
    const headPos = position.offset(0, bot.entity.height, 0)
    const directionBlock = headPos.plus(vector.normalize()).floored()
    const direction = directionBlock.minus(headPos.floored())
    direction.y = -1
    const block = bot.blockAt(headPos.plus(direction.scaled(1)))
    const blockName = block === null ? "null" : block.name
    return blockName !== "null" && blockName !== "air"
}

function isBlockAtBottom(bot) {
    const {yaw, pitch, position} = bot.entity
    const vector = getViewVector(pitch, yaw)
    const headPos = position.offset(0, bot.entity.height, 0)
    const directionBlock = headPos.plus(vector.normalize()).floored()
    const direction = directionBlock.minus(headPos.floored())
    direction.y = -2
    const block = bot.blockAt(headPos.plus(direction.scaled(1)))
    const blockName = block === null ? "null" : block.name
    return blockName !== "null" && blockName !== "air"
}


function getViewVector(pitch, yaw) {
    const csPitch = Math.cos(pitch)
    const snPitch = Math.sin(pitch)
    const csYaw = Math.cos(yaw)
    const snYaw = Math.sin(yaw)
    return new Vec3(-snYaw * csPitch, snPitch, -csYaw * csPitch)
}

module.exports = {
    isBlockInFront,
    isBlockAtBottom
}