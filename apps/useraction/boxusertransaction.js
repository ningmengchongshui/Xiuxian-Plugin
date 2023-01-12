import robotapi from "../../model/robotapi.js"
import { superIndex } from "../../model/robotapi.js"
import {
    Numbers,
    addLingshi,
    point_map,
    exist_najie_thing_name,
    Add_najie_thing,
    existplayer,
    ForwardMsg,
    Read_najie,
    Write_najie,
    Read_action,
    returnCommodities
} from '../../model/public.js'
export class boxusertransaction extends robotapi {
    constructor() {
        super(superIndex([
            {
                reg: '^#购买.*$',
                fnc: 'Buy_comodities'
            },
            {
                reg: '^#出售.*$',
                fnc: 'Sell_comodities'
            },
            {
                reg: '^#凡仙堂$',
                fnc: 'ningmenghome',
            },
        ]))
    }
    ningmenghome = async (e) => {
        const usr_qq = e.user_id
        const ifexistplay = await existplayer(usr_qq)
        if (!ifexistplay) {
            return
        }
        const action = await Read_action(usr_qq)
        const address_name = '凡仙堂'
        const map = await point_map(action, address_name)
        if (!map) {
            e.reply(`需[#前往+城池名+${address_name}]`)
            return
        }
        const msg = [
            '___[凡仙堂]___\n#购买+物品名*数量\n不填数量,默认为1'
        ]
        const commodities_list = await returnCommodities()
        commodities_list.forEach((item) => {
            const id = item.id.split('-')
            if (id[0] == 4) {
                if (id[1] == 1) {
                    msg.push(`物品:${item.name}\n气血:${item.blood}%\n价格:${item.price}`)
                } else {
                    msg.push(`物品:${item.name}\n修为:${item.experience}\n价格:${item.price}`)
                }
            } else if (id[0] == 5) {
                msg.push(`物品:${item.name}\n天赋:${item.size}%\n价格:${item.price}`)
            }
        })
        await ForwardMsg(e, msg)
        return
    }
    Buy_comodities = async (e) => {
        if (!e.isGroup) {
            return
        }
        const usr_qq = e.user_id
        const ifexistplay = await existplayer(usr_qq)
        if (!ifexistplay) {
            return
        }
        const action = await Read_action(usr_qq)
        const address_name = '凡仙堂'
        const map = await point_map(action, address_name)
        if (!map) {
            e.reply(`需[#前往+城池名+${address_name}]`)
            return
        }
        const thing = e.msg.replace('#购买', '')
        const code = thing.split('\*')
        const [thing_name, thing_acount] = code
        let quantity = await Numbers(thing_acount)
        if (quantity > 99) {
            quantity = 99
        }
        const Commodities=await returnCommodities()
        const ifexist = Commodities.find(item => item.name == thing_name)
        if (!ifexist) {
            e.reply(`[凡仙堂]小二\n不卖:${thing_name}`)
            return
        }
        let money = await exist_najie_thing_name(usr_qq, '下品灵石')
        if (money == 1 || money.acount < ifexist.price * quantity) {
            e.reply([segment.at(usr_qq), `似乎没有${ifexist.price * quantity}下品灵石`])
            return
        }
        //先扣钱
        await addLingshi(usr_qq, -ifexist.price * quantity)
        //重新把东西丢回去
        let najie = await Read_najie(usr_qq)
        najie = await Add_najie_thing(najie, ifexist, quantity)
        await Write_najie(usr_qq, najie)
        e.reply(`[凡仙堂]薛仁贵\n你花[${ifexist.price * quantity}]下品灵石购买了[${thing_name}]*${quantity},`)
        return
    }
    Sell_comodities = async (e) => {
        if (!e.isGroup) {
            return
        }
        const usr_qq = e.user_id
        const ifexistplay = await existplayer(usr_qq)
        if (!ifexistplay) {
            return
        }
        const action = await Read_action(usr_qq)
        const address_name = '凡仙堂'
        const map = await point_map(action, address_name)
        if (!map) {
            e.reply(`需[#前往+城池名+${address_name}]`)
            return
        }
        const thing = e.msg.replace('#出售', '')
        const code = thing.split('\*')
        const [thing_name, thing_acount] = code//数量
        const the = {
            "quantity": 99,
            "najie": {}
        }
        the.quantity = await Numbers(thing_acount)
        if (the.quantity > 99) {
            the.quantity = 99
        }
        const najie_thing = await exist_najie_thing_name(usr_qq, thing_name)
        if (najie_thing == 1) {
            e.reply(`[凡仙堂]小二\n你没[${thing_name}]`)
            return
        }
        if (najie_thing.acount < the.quantity) {
            e.reply('[凡仙堂]小二\n数量不足')
            return
        }
        the.najie = await Read_najie(usr_qq)
        the.najie = await Add_najie_thing(the.najie, najie_thing, -the.quantity)
        await Write_najie(usr_qq, the.najie)
        const commodities_price = najie_thing.price * the.quantity
        await addLingshi(usr_qq, commodities_price)
        e.reply(`[凡仙堂]欧阳峰\n出售得${commodities_price}下品灵石 `)
        return
    }
}