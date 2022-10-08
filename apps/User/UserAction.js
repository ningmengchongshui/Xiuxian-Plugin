
import plugin from '../../../../lib/plugins/plugin.js'
import config from "../../model/Config.js"
import * as Xiuxian from '../Xiuxian/Xiuxian.js'
import { get_najie_img } from '../ShowImeg/showData.js'
/**
 * 交易系统
 */
export class UserAction extends plugin {
    constructor() {
        super({
            /** 功能名称 */
            name: 'UserAction',
            /** 功能描述 */
            dsc: 'UserAction',
            event: 'message',
            /** 优先级，数字越小等级越高 */
            priority: 600,
            rule: [
                {
                    reg: '^#储物袋$',
                    fnc: 'Show_najie'
                },
                {
                    reg: '^#升级储物袋$',
                    fnc: 'Lv_up_najie'
                },
                {
                    reg: '^#(存|取)灵石(.*)$',
                    fnc: 'Take_lingshi'
                }
            ]
        })
        this.xiuxianConfigData = config.getConfig("xiuxian", "xiuxian");
    }


    //#储物袋
    async Show_najie(e) {
        if (!e.isGroup) {
            return;
        }
        let usr_qq = e.user_id;
        let ifexistplay = await Xiuxian.existplayer(usr_qq);
        if (!ifexistplay) {
            return;
        }
        let img = await get_najie_img(e);
        e.reply(img);
        return;
    }


    //升级储物袋
    async Lv_up_najie(e) {
        let Go=await Xiuxian.Go(e);
        if (!Go) {
            return;
        }
        let usr_qq = e.user_id;
        let najie = await Xiuxian.Read_najie(usr_qq);
        let player = await Xiuxian.Read_player(usr_qq);
        let najie_num = this.xiuxianConfigData.najie_num
        let najie_price = this.xiuxianConfigData.najie_price
        if (najie.grade == najie_num.length) {
            e.reply("已经是最高级的了")
            return;
        }
        if (player.lingshi < najie_price[najie.grade]) {
            e.reply(`灵石不足,还需要准备${najie_price[najie.grade] - player.lingshi}灵石`)
            return;
        }
        await Xiuxian.Add_lingshi(usr_qq, -najie_price[najie.grade]);
        najie.lingshimax = najie_num[najie.grade];
        najie.grade += 1;
        await Xiuxian.Write_najie(usr_qq, najie);
        e.reply(`花了${najie_price[najie.grade - 1]}灵石升级,目前灵石存储上限为${najie.lingshimax}`)
        return;
    }

    
    async Take_lingshi(e) {
        let Go = await Xiuxian.Go(e);
        if (!Go) {
            return;
        }
        let usr_qq = e.user_id;
        var reg = new RegExp(/取|存/);
        let func = reg.exec(e.msg);
        let msg = e.msg.replace(reg, '');
        msg = msg.replace("#", '');
        let lingshi = msg.replace("灵石", '');
        if (lingshi == "全部") {
            let P = await Xiuxian.Read_player(usr_qq);
            lingshi = P.lingshi;

        }

        lingshi=await Xiuxian.Numbers(lingshi);

        if (func == "存") {
            let player_lingshi = await Xiuxian.Read_player(usr_qq);
            player_lingshi = player_lingshi.lingshi;
            if (player_lingshi < lingshi) {
                e.reply([segment.at(usr_qq), `灵石不足,你目前只有${player_lingshi}灵石`]);
                return;
            }
            let najie = await Xiuxian.Read_najie(usr_qq);
            if (najie.lingshimax < najie.lingshi + lingshi) {
                await Xiuxian.Add_najie_lingshi(usr_qq, najie.lingshimax - najie.lingshi);
                await Xiuxian.Add_lingshi(usr_qq, -najie.lingshimax + najie.lingshi);
                e.reply([segment.at(usr_qq), `已为您放入${najie.lingshimax - najie.lingshi}灵石,储物袋存满了`]);
                return;
            }
            await Xiuxian.Add_najie_lingshi(usr_qq, lingshi);
            await Xiuxian.Add_lingshi(usr_qq, -lingshi);
            e.reply([segment.at(usr_qq), `储存完毕,你目前还有${player_lingshi - lingshi}灵石,储物袋内有${najie.lingshi + lingshi}灵石`]);
            return;
        }

        if (func == "取") {
            let najie = await Xiuxian.Read_najie(usr_qq);
            if (najie.lingshi < lingshi) {
                e.reply([segment.at(usr_qq), `储物袋灵石不足,你目前最多取出${najie.lingshi}灵石`]);
                return;
            }
            let player_lingshi = await Xiuxian.Read_player(usr_qq);
            player_lingshi = player_lingshi.lingshi;
            await Xiuxian.Add_najie_lingshi(usr_qq, -lingshi);
            await Xiuxian.Add_lingshi(usr_qq, lingshi);
            e.reply([segment.at(usr_qq), `本次取出灵石${lingshi},你的储物袋还剩余${najie.lingshi - lingshi}灵石`]);
            return;
        }
        return;
    }

}