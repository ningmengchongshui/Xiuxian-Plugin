import { BotApi, GameApi, plugin } from '../../model/api/index.js'
export class BoxSecretplace extends plugin {
  constructor() {
    super({
      rule: [
        { reg: /^(#|\/)坐标信息$/, fnc: 'xyzaddress' },
        { reg: /^(#|\/)位置信息$/, fnc: 'showCity' },
        { reg: /^(#|\/)前往[\u4e00-\u9fa5]*$/, fnc: 'forward' },
        { reg: /^(#|\/)返回$/, fnc: 'falsePiont' },
        { reg: /^(#|\/)传送[\u4e00-\u9fa5]*$/, fnc: 'delivery' }
      ]
    })
  }

  async xyzaddress(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.Player.getUserLifeSatus(UID)) {
      e.reply('已仙鹤')
      return false
    }
    const action = GameApi.UserData.controlAction({
      NAME: UID,
      CHOICE: 'playerAction'
    })
    const isreply = e.reply(`坐标(${action.x},${action.y},${action.z})`)
    BotApi.Robot.surveySet({ e, isreply })
    return false
  }

  async showCity(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.Player.getUserLifeSatus(UID)) {
      e.reply('已仙鹤')
      return false
    }
    const action = GameApi.UserData.controlAction({
      NAME: UID,
      CHOICE: 'playerAction'
    })
    if (action.address != 1) {
      e.reply('你对这里并不了解...')
      return false
    }
    const addressId = `${action.z}-${action.region}-${action.address}`
    const point = GameApi.UserData.controlAction({
      NAME: 'point',
      CHOICE: 'generate_position'
    })
    const address = []
    const msg = []
    for (let item of point) {
      if (item.id.includes(addressId)) {
        address.push(item)
      }
    }
    for (let item of address) {
      msg.push(`地点名:${item.name}\n坐标(${item.x},${item.y})`)
    }
    const isreply = await e.reply(
      await BotApi.obtainingImages({ path: 'msg', name: 'msg', data: { msg } })
    )
    BotApi.Robot.surveySet({ e, isreply })
    return false
  }

  async falsePiont(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.Player.getUserLifeSatus(UID)) {
      e.reply('已仙鹤')
      return false
    }
    let action = GameApi.Wrap.getAction(UID)
    if (!action) return false
    if (action.actionID == 2) {
      GameApi.Wrap.deleteAction(UID)
      // 取消行为
      clearTimeout(GameApi.Place.getUserAction(UID))
      e.reply('已回到原地')
      return false
    }
    return false
  }

  async forward(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.Player.getUserLifeSatus(e.user_id)) {
      e.reply('已仙鹤')
      return false
    }
    const { state, msg } = GameApi.Wrap.Go(e.user_id)
    if (state == 4001) {
      e.reply(msg)
      return false
    }
    /* 检查地点 */
    const action = GameApi.UserData.controlAction({
      NAME: UID,
      CHOICE: 'playerAction'
    })
    const x = action.x
    const y = action.y
    const address = e.msg.replace(/^(#|\/)前往/, '')
    const Point = GameApi.UserData.controlAction({
      NAME: 'point',
      CHOICE: 'generate_position'
    })
    const point = Point.find((item) => item.name == address)
    if (!point) {
      return false
    }
    /* */
    const mx = point.x
    const my = point.y
    const PointId = point.id.split('-')
    const level = GameApi.UserData.controlAction({
      NAME: UID,
      CHOICE: 'playerLevel'
    })
    // 境界不足
    if (level.levelId < PointId[3]) {
      e.reply('[修仙联盟]守境者\n道友请留步')
      return false
    }
    const a = x - mx >= 0 ? x - mx : mx - x
    const b = y - my >= 0 ? y - my : my - y
    const battle = GameApi.UserData.controlAction({
      NAME: UID,
      CHOICE: 'playerBattle'
    })
    const the = Math.floor(a + b - (a + b) * battle.speed * 0.01)
    const time = the >= 0 ? the : 1
    // 设置定时器,并得到定时器id
    GameApi.Place.setUserAction(
      UID,
      setTimeout(() => {
        /* 这里清除行为 */
        GameApi.Wrap.deleteAction(UID)
        action.x = mx
        action.y = my
        action.region = PointId[1]
        action.address = PointId[2]
        GameApi.UserData.controlAction({
          NAME: UID,
          CHOICE: 'playerAction',
          DATA: action
        })
        e.reply([segment.at(UID), `成功抵达${address}`])
      }, 1000 * time)
    )
    // 设置行为赶路
    GameApi.Wrap.setAction(UID, {
      actionID: 2,
      startTime: 1000 * time
    })
    e.reply(`正在前往${address}...\n需要${time}秒`)
    return false
  }

  async delivery(e) {
    if (!this.verify(e)) return false
    const UID = e.user_id
    if (!GameApi.Player.getUserLifeSatus(e.user_id)) {
      e.reply('已仙鹤')
      return false
    }
    const { state, msg } = GameApi.Wrap.Go(e.user_id)
    if (state == 4001) {
      e.reply(msg)
      return false
    }
    const action = GameApi.UserData.controlAction({
      NAME: UID,
      CHOICE: 'playerAction'
    })
    const x = action.x
    const y = action.y
    const address = e.msg.replace(/^(#|\/)传送/, '')
    const Posirion = GameApi.UserData.controlAction({
      NAME: 'position',
      CHOICE: 'generate_position'
    })
    const position = Posirion.find((item) => item.name == address)
    if (!position) {
      return false
    }
    const positionID = position.id.split('-')
    const level = GameApi.UserData.controlAction({
      NAME: UID,
      CHOICE: 'playerLevel'
    })
    if (level.levelId < positionID[3]) {
      e.reply('[修仙联盟]守境者\n道友请留步')
      return false
    }
    const point = GameApi.UserData.controlAction({
      NAME: 'point',
      CHOICE: 'generate_position'
    })
    let key = 0
    for (let item of point) {
      const pointID = item.id.split('-')
      if (pointID[4] == 2) {
        if (item.x == x) {
          if ((item.y = y)) {
            key = 1
          }
        }
      }
    }
    if (key == 0) {
      return false
    }
    const lingshi = 1000
    const money = GameApi.Bag.searchBagByName({
      UID,
      name: '下品灵石'
    })
    if (!money || money.acount < lingshi) {
      e.reply(`[修仙联盟]守阵者\n需要花费${lingshi}*[下品灵石]`)
      return false
    }
    // 先扣钱
    GameApi.Bag.addBagThing({
      UID,
      name: '下品灵石',
      ACCOUNT: -lingshi
    })
    const mx = Math.floor(Math.random() * (position.x2 - position.x1)) + Number(position.x1)
    const my = Math.floor(Math.random() * (position.y2 - position.y1)) + Number(position.y1)
    const the = Math.floor(
      ((x - mx >= 0 ? x - mx : mx - x) + (y - my >= 0 ? y - my : my - y)) / 100
    )
    const time = the > 0 ? the : 1
    setTimeout(() => {
      // 清除行为
      GameApi.Wrap.deleteAction(UID)
      action.x = mx
      action.y = my
      action.region = positionID[1]
      action.address = positionID[2]
      GameApi.UserData.controlAction({
        NAME: UID,
        CHOICE: 'playerAction',
        DATA: action
      })
      e.reply([segment.at(UID), `成功传送至${address}`])
    }, 1000 * time)
    // 传送行为记录
    GameApi.Wrap.setAction(UID, {
      actionID: 3,
      startTime: 1000 * time
    })
    e.reply(`[修仙联盟]守阵者\n传送对接${address}\n需要${time}秒`)
    return false
  }
}