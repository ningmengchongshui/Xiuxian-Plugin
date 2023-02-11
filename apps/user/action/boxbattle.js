import { BotApi, GameApi, plugin } from '../../../model/api/api.js'
export class boxbattle extends plugin {
    constructor() {
        super(BotApi.SuperIndex.getUser({
            rule: [
                {
                    reg: '^#死斗.*$',
                    fnc: 'duel'
                },
                {
                    reg: '^#洗手$',
                    fnc: 'handWashing'
                }
            ]
        }))
    }
    duel = async (e) => {
        if (!e.isGroup) {
            return
        }
        if (!await GameApi.GameUser.existUserSatus({ UID: e.user_id })) {
            e.reply('已死亡')
            return
        }
        const { MSG } = await GameApi.GamePublic.Go({ UID: e.user_id })
        if (MSG) {
            e.reply(MSG)
            return
        }
        const user = {
            A: e.user_id,
            C: 0,
            QQ: 0,
            p: Math.floor((Math.random() * (99 - 1) + 1))
        }
        user['B'] = await BotApi.User.at({ e })
        /*AI优先*/
        if (!user['B']) {
            /** ai不存在就试试UID*/
            const UID = GameApi.GamePublic.leastOne({ value: e.msg.replace('#死斗', '') })
            if (UID == 1) {
                /** 并没有找到*/
                return
            }
            user['B'] = UID
        }
        if (user['B'] == user['A']) {
            return
        }
        if (!await GameApi.GameUser.existUserSatus({ UID: user['B'] })) {
            e.reply('已死亡')
            return
        }
        const actionA = await GameApi.GameUser.userMsgAction({ NAME: user.A, CHOICE: 'user_action' })
        const actionB = await GameApi.GameUser.userMsgAction({ NAME: user.B, CHOICE: 'user_action' })
        if (actionA.region != actionB.region) {
            e.reply('此地未找到此人')
            return
        }
        const CDID = '11'
        const now_time = new Date().getTime()
        const cf = GameApi.DefsetUpdata.getConfig({ app: 'parameter', name: 'cooling' })
        const CDTime = cf.CD.Attack ? cf.CD.Attack : 5
        const { CDMSG } = await GameApi.GamePublic.cooling({ UID: user.A, CDID })
        if (CDMSG) {
            e.reply(CDMSG)
            return
        }
        await redis.set(`xiuxian:player:${user.A}:${CDID}`, now_time)
        await redis.expire(`xiuxian:player:${user.A}:${CDID}`, CDTime * 60)
        /** 如果在城里就默认消耗决斗令*/
        if (actionA.address == 1) {
            const najie_thing = await GameApi.GameUser.userBagSearch({ UID: user.A, name: '决斗令' })
            if (!najie_thing) {
                e.reply('[修仙联盟]普通卫兵:城内不可出手!')
                return
            }
            /**消耗决斗令*/
            await GameApi.GameUser.userBag({ UID: user.A, name: najie_thing.name, ACCOUNT: -1 })
        }
        /**战斗*/
        user.QQ = await GameApi.GameBattle.battle({ e, A: user.A, B: user.B })
        const Level = await GameApi.GameUser.userMsgAction({ NAME: user.A, CHOICE: 'user_level' })
        Level.prestige += 1
        await GameApi.GameUser.userMsgAction({ NAME: user.A, CHOICE: 'user_level', DATA: Level })
        const LevelB = await GameApi.GameUser.userMsgAction({ NAME: user.B, CHOICE: 'user_level' })
        const MP = LevelB.prestige * 10 + Number(50)
        if (user.p <= MP) {
            if (user.QQ != user.A) {
                user.C = user.A
                user.A = user.B
                user.B = user.C
            }
            let najieB = await GameApi.GameUser.userMsgAction({ NAME: user.B, CHOICE: 'user_bag' })
            if (najieB.thing.length != 0) {
                const thing = await GameApi.GamePublic.Anyarray({ ARR: najieB.thing })
                najieB.thing = najieB.thing.filter(item => item.name != thing.name)
                await GameApi.GameUser.userMsgAction({ NAME: user.B, CHOICE: 'user_bag', DATA: najieB })
                await GameApi.GameUser.userBag({ UID: user.A, name: thing.name, ACCOUNT: thing.acount })
                e.reply(`${user.A}夺走了[${thing.name}]*${thing.acount}`)
            }
        }
        return
    }
    handWashing = async (e) => {
        if (!e.isGroup) {
            return
        }
        const UID = e.user_id
        if (!await GameApi.GameUser.existUserSatus({ UID })) {
            e.reply('已死亡')
            return
        }
        const Level = await GameApi.GameUser.userMsgAction({ NAME: UID, CHOICE: 'user_level' })
        const money = 10000 * Level.level_id
        if (Level.prestige > 0) {
            const thing = await GameApi.GameUser.userBagSearch({ UID, name: '下品灵石' })
            if (!thing || thing.acount < money) {
                e.reply(`[天机门]韩立\n清魔力需要${money}[下品灵石]`)
                return
            }
            await GameApi.GameUser.userBag({ UID, name: '下品灵石', ACCOUNT: -money })
            Level.prestige -= 1
            await GameApi.GameUser.userMsgAction({ NAME: UID, CHOICE: 'user_level', DATA: Level })
            e.reply('[天机门]南宫问天\n为你清除[魔力]*1')
            return
        } else {
            e.reply('[天机门]李逍遥\n你一身清廉')
        }
        return
    }
}