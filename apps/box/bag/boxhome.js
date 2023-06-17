import { BotApi, GameApi, plugin } from '../../../model/api/index.js'
export class BoxHome extends plugin {
  constructor() {
    super({
      rule: [
        { reg: /^(#|\/)服用[\u4e00-\u9fa5]*$/, fnc: 'take' },
        { reg: /^(#|\/)学习[\u4e00-\u9fa5]*$/, fnc: 'study' },
        { reg: /^(#|\/)忘掉[\u4e00-\u9fa5]*$/, fnc: 'forget' },
        { reg: /^(#|\/)消耗[\u4e00-\u9fa5]*$/, fnc: 'consumption' }
      ]
    })
  }

  async take(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.GameUser.existUserSatus({ UID })) {
      e.reply('已仙鹤')
      return false
    }
    let [thingName, thingAcount] = e.msg.replace(/^(#|\/)服用/, '').split('*')
    thingAcount = GameApi.GamePublic.leastOne({ value: thingAcount })
    const najieThing = GameApi.GameUser.userBagSearch({
      UID,
      name: thingName
    })
    if (!najieThing) {
      e.reply(`没有[${thingName}]`)
      return false
    }
    if (najieThing.acount < thingAcount) {
      e.reply('数量不足')
      return false
    }
    const id = najieThing.id.split('-')
    let x = 0 // 用于判断pa数组内是否存在id[0]
    let pa = [1, 2, 3, 4, 5, 6]
    for (let i = 0; i < pa.length; i++) {
      if (id[0] == pa[i]) {
        x = 1
      }
    }
    if (x != 1) {
      e.reply(`你看看${thingName}，想想怎么吞都吞不下去吧`)
      return
    }
    switch (id[1]) {
      case '1': {
        let blood = parseInt(najieThing.blood)
        GameApi.GameUser.updataUserBlood({ UID, SIZE: Number(blood) })
        const battle = GameApi.UserData.controlAction({
          NAME: UID,
          CHOICE: 'user_battle'
        })
        e.reply(
          `成功服用${thingName}，当前血量为：${battle.nowblood}（${Math.trunc(
            (battle.nowblood / battle.blood) * 100
          )}%）`
        )
        break
      }
      case '2': {
        let experience = parseInt(najieThing.experience)
        if (id[0] == '6') {
          if (thingAcount > 2200) {
            thingAcount = 2200
          }
          const cf = GameApi.DefsetUpdata.getConfig({
            app: 'parameter',
            name: 'cooling'
          })
          const CDTime = cf.CD.Practice ? cf.CD.Practice : 5
          const CDID = '12'
          const nowTime = new Date().getTime()
          const { CDMSG } = GameApi.GamePublic.cooling({ UID, CDID })
          if (CDMSG) {
            experience = 0
            e.reply(CDMSG)
          }
          GameApi.GamePublic.setRedis(UID, CDID, nowTime, CDTime)
          const player = GameApi.UserData.controlAction({
            NAME: UID,
            CHOICE: 'user_level'
          })
          switch (id[2]) {
            case '1': {
              if (player.levelId >= 3) {
                experience = 0
              }
              break
            }
            case '2': {
              if (player.levelId >= 5) {
                experience = 0
              }
              break
            }
            case '3': {
              if (player.levelId >= 7) {
                experience = 0
              }
              break
            }
            case '4': {
              if (player.levelId >= 9) {
                experience = 0
              }
              break
            }
            default: {
              console.log('无')
            }
          }
        }
        if (experience > 0) {
          GameApi.GameUser.updataUser({
            UID,
            CHOICE: 'user_level',
            ATTRIBUTE: 'experience',
            SIZE: thingAcount * experience
          })
        }
        e.reply(`[修为]+${thingAcount * experience}`)
        break
      }
      case '3': {
        let experiencemax = parseInt(najieThing.experiencemax)
        GameApi.GameUser.updataUser({
          UID,
          CHOICE: 'user_level',
          ATTRIBUTE: 'experiencemax',
          SIZE: thingAcount * experiencemax
        })
        e.reply(`[气血]+${thingAcount * experiencemax}`)
        break
      }
      default: {
        console.log('无')
      }
    }
    GameApi.GameUser.userBag({
      UID,
      name: najieThing.name,
      ACCOUNT: -thingAcount
    })
    return false
  }

  async study(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.GameUser.existUserSatus({ UID })) {
      e.reply('已仙鹤')
      return false
    }
    const thingName = e.msg.replace(/^(#|\/)学习/, '')
    const najieThing = GameApi.GameUser.userBagSearch({
      UID,
      name: thingName
    })
    if (!najieThing) {
      e.reply(`没有[${thingName}]`)
      return false
    }
    const id = najieThing.id.split('-')
    if (id[0] != 5) {
      return false
    }
    const talent = GameApi.UserData.controlAction({
      NAME: UID,
      CHOICE: 'user_talent'
    })
    const islearned = talent.AllSorcery.find((item) => item.id == najieThing.id)
    if (islearned) {
      e.reply('学过了')
      return false
    }
    if (
      talent.AllSorcery.length >=
      GameApi.DefsetUpdata.getConfig({ app: 'parameter', name: 'cooling' }).myconfig.gongfa
    ) {
      e.reply('你反复看了又看,却怎么也学不进')
      return false
    }
    talent.AllSorcery.push(najieThing)
    GameApi.UserData.controlAction({
      NAME: UID,
      CHOICE: 'user_talent',
      DATA: talent
    })
    GameApi.GameUser.updataUserEfficiency({ UID })
    GameApi.GameUser.userBag({
      UID,
      name: najieThing.name,
      ACCOUNT: -1
    })
    e.reply(`学习[${thingName}]`)
    return false
  }

  async forget(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.GameUser.existUserSatus({ UID })) {
      e.reply('已仙鹤')
      return false
    }
    const thingName = e.msg.replace(/^(#|\/)忘掉/, '')
    const talent = GameApi.UserData.controlAction({
      NAME: UID,
      CHOICE: 'user_talent'
    })
    const islearned = talent.AllSorcery.find((item) => item.name == thingName)
    if (!islearned) {
      e.reply(`没学过[${thingName}]`)
      return false
    }
    talent.AllSorcery = talent.AllSorcery.filter((item) => item.name != thingName)
    GameApi.UserData.controlAction({
      NAME: UID,
      CHOICE: 'user_talent',
      DATA: talent
    })
    GameApi.GameUser.updataUserEfficiency({ UID })
    GameApi.GameUser.userBag({ UID, name: islearned.name, ACCOUNT: 1 })
    e.reply(`忘了[${thingName}]`)
    return false
  }

  async consumption(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.GameUser.existUserSatus({ UID })) {
      e.reply('已仙鹤')
      return false
    }
    const thingName = e.msg.replace(/^(#|\/)消耗/, '')
    const najieThing = GameApi.GameUser.userBagSearch({
      UID,
      name: thingName
    })
    if (!najieThing) {
      e.reply(`没有[${thingName}]`)
      return false
    }
    GameApi.GameUser.userBag({
      UID,
      name: najieThing.name,
      ACCOUNT: -1
    })
    const id = najieThing.id.split('-')
    if (id[0] != 6) {
      e.reply(`[${thingName}]损坏`)
      return false
    }
    if (id[1] == 1) {
      switch (id[2]) {
        case '1': {
          const player = GameApi.UserData.controlAction({
            NAME: UID,
            CHOICE: 'user_level'
          })
          if (player.levelId >= 10) {
            e.reply('[灵根]已定\n此生不可再洗髓')
            break
          }
          const talent = GameApi.UserData.controlAction({
            NAME: UID,
            CHOICE: 'user_talent'
          })
          talent.talent = GameApi.GameUser.getTalent()
          GameApi.UserData.controlAction({
            NAME: UID,
            CHOICE: 'user_talent',
            DATA: talent
          })
          GameApi.GameUser.updataUserEfficiency({ UID })
          const { path, name, data } = GameApi.Information.userDataShow({
            UID: e.user_id
          })
          const isreply = e.reply(await BotApi.obtainingImages({ path, name, data }))
          BotApi.Robot.surveySet({ e, isreply })
          break
        }
        case '2': {
          const talent = GameApi.UserData.controlAction({
            NAME: UID,
            CHOICE: 'user_talent'
          })
          talent.talentshow = 0
          GameApi.UserData.controlAction({
            NAME: UID,
            CHOICE: 'user_talent',
            DATA: talent
          })
          const { path, name, data } = GameApi.Information.userDataShow({
            UID: e.user_id
          })
          const isreply = e.reply(await BotApi.obtainingImages({ path, name, data }))
          BotApi.Robot.surveySet({ e, isreply })
          break
        }
        default: {
          console.log('无')
        }
      }
    }
    return false
  }
}
