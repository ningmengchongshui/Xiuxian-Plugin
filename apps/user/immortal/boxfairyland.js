import { GameApi, plugin, BotApi, verify } from '../../../model/api/api.js'
import gamePublic from '../../../model/game/public/index.js'
const useraction = [];
export class boxfairyland extends plugin {
  constructor() {
    super(
      BotApi.SuperInex.getUser({
        name: "xiuxian@2.0.0",
        dsc: "xiuxian@2.0.0",
        rule: [
          { reg: /^#渡劫$/, fnc: 'breakLevel' },
          { reg: /^#望天$/, fnc: 'breakSky' }
        ],
      })
    );
  }

  /**
   * 成就仙人境
   */
  async breakLevel(e) {
    let UID = e.user_id
    if (!verify(e)) return false
    const ifexistplay = await GameApi.GameUser.existUserSatus({ UID })
    if (!ifexistplay) {
      e.reply(`已仙鹤`);
      return
    }
    const UserLevel = await GameApi.UserData.listAction({
      NAME: UID,
      CHOICE: 'user_level'
    })
    if (UserLevel.level_id != 10) {
      /*不是渡劫*/
      e.reply(`非渡劫期`);
      return
    }
    let msg = `你找到了一处绝佳位置，正在尝试渡劫。\n雷劫落下九死一生，渡过将粹洗灵魂，成就无上仙位\n是否开始渡劫(请输入：开始渡劫/不渡劫)`;
    e.reply(msg);
    this.setContext("levelBreak1");
    return
  }
  async levelBreak1(e) {
    let UID = e.user_id;
    let new_msg = this.e.message;
    let choice = new_msg[0].text;
    if (choice == "不渡劫") {
      this.finish("levelBreak1");
      e.reply(`你因恐惧雷劫威压，决定不渡劫！`);
      return;
    }
    if (choice != "开始渡劫") {
      e.reply(`(没有这样的选项，请重新输入)`);
      return;
    }
    this.finish("levelBreak1");
    const talent = await GameApi.UserData.listAction({
      NAME: UID,
      CHOICE: 'user_talent'
    })
    let Thunderbolt = {
      "1": 9,
      "2": 7,
      "3": 5,
      "4": 3,
      "5": 1
    }
    let msg1 = `忽然间，风云突变，四面八方的乌云汇聚在你头顶，变成了一个漩涡状的云，期间还有伴随恐怖的雷声。你独坐在石台上，以全部修为凝聚成护体屏障，准备接下里的雷劫`
    let msg2 = `由于你有${talent.talent.length}种灵根，将会降下${Thunderbolt[talent.talent.length]}道雷劫，每30秒降一道雷`
    e.reply(`${msg1}\n${msg2}`);
    const battle = await GameApi.UserData.listAction({
      NAME: UID,
      CHOICE: 'user_battle'
    })
    if (battle.nowblood < 0) {
      e.reply(`你还未经理${Thunderbolt[talent.talent.length]}道雷劫的洗礼，就一已经身死，损失10000修为，险些跌落境界`)
      return false
    }
    let time = 30
    useraction[UID] = setTimeout(async () => {
      for (let i = 0; i < Thunderbolt[talent.talent.length]; i++) {
        useraction[UID] = setTimeout(async () => {
          const battle = await GameApi.UserData.listAction({
            NAME: UID,
            CHOICE: 'user_battle'
          })
          if (battle.nowblood > 0) {
            let damage = Math.trunc(await GameApi.GameBattle.Thunderbolt_damage({ UID }))
            battle.nowblood -= damage
            if (battle.nowblood < 0) {
              battle.nowblood = 0
            }
            await GameApi.UserData.listAction({
              NAME: UID,
              CHOICE: 'user_battle',
              DATA: battle
            })
            e.reply(`第${i + 1}道雷劫劈下，你损失了${damage}点血量，还剩${battle.nowblood}(${Math.trunc(battle.nowblood / battle.blood * 100)}%)点血量`)
          }
          else {
            const play = await GameApi.UserData.listAction({
              NAME: UID,
              CHOICE: 'user_player'
            })
            play.dujiedie = 1
            await GameApi.UserData.listAction({
              NAME: UID,
              CHOICE: 'user_player',
              DATA: play
            })
            e.reply(`第${i + 1}道雷劫劈下，你虽然已经生死，但是依旧无法逃脱${Thunderbolt[talent.talent.length]}道雷劫的惩罚`)
          }
        }, 1000 * time * i);
      }
    }, 1000 * 5);
    useraction[UID] = setTimeout(async () => {
      const battle = await GameApi.UserData.listAction({
        NAME: UID,
        CHOICE: 'user_battle'
      })

      const Levellist = await GameApi.UserData.listAction({
        CHOICE: 'generate_level',
        NAME: 'gaspractice'
      })
      const Level = Levellist.find((item) => item.id == player.level_id)
      if (battle.nowblood > 0) {
        const { UserLevelUpMSG } = await GameApi.UserAction.breakLevelUp({
          UID
        })
        e.reply(`你顶住了${Thunderbolt[talent.talent.length]}道雷劫的洗礼，${UserLevelUpMSG}`)
      } else {
        const player = await GameApi.UserData.listAction({
          NAME: UID,
          CHOICE: 'user_level'
        })
        if (player.experiencemax < 120000) {
          player.level_id -= 1
          player.levelname = Levellist.find((item) => item.id == player.level_id).name
          player.rank_id = 4
          e.reply(`你未顶住${Thunderbolt[talent.talent.length]}道雷劫的洗礼，修为不足120000，无法抵御威压，跌落境界`)
        } else {
          player.experience -= Level.exp
          e.reply(`你未顶住${Thunderbolt[talent.talent.length]}道雷劫的洗礼,已生死虽肉体已已毁灭，凭借自己强大的修为，强行凝绝出人性容器，保证灵魂未消散(损失120000修为)`)
        }
        await GameApi.UserData.listAction({
          NAME: UID,
          CHOICE: 'user_level',
          DATA: player
        })
      }
      await GameApi.UserData.listAction({
        NAME: UID,
        CHOICE: 'user_battle',
        DATA: battle
      })
      const play = await GameApi.UserData.listAction({
        NAME: UID,
        CHOICE: 'user_player'
      })
      play.dujiedie = 0
      await GameApi.UserData.listAction({
        NAME: UID,
        CHOICE: 'user_player',
        DATA: play
      })
    }, 1000 * time * Thunderbolt[talent.talent.length] + 7000);
    return false
  }

  /**
   * 仙人突破
   */

  breakSky = async (e) => {
    if (!verify(e)) return false
    e.reply('待世界升级~')
    return false
  }
}
