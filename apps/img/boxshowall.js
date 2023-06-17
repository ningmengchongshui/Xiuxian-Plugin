import { BotApi, GameApi, plugin } from '../../model/api/index.js'
export class boxshowall extends plugin {
  constructor() {
    super({
      rule: [
        { reg: /^(#|\/)修仙地图$/, fnc: 'showMap' },
        { reg: /^(#|\/)修仙配置$/, fnc: 'showConfig' },
        { reg: /^(#|\/)修仙管理$/, fnc: 'adminSuper' },
        { reg: /^(#|\/)修仙(帮助|菜单|help|列表)$/, fnc: 'boxhelp' },
        { reg: /^(#|\/)黑市(帮助|菜单|help|列表)$/, fnc: 'darkhelp' }
      ]
    })
  }
  async showMap(e) {
    if (!this.verify(e)) return false
    const isreply = e.reply(BotApi.ImgIndex.showPuppeteer({ path: 'map', name: 'map' }))
    BotApi.User.surveySet({ e, isreply })
    return false
  }
  async showConfig(e) {
    if (!this.verify(e)) return false
    const cf = GameApi.DefsetUpdata.getConfig({
      app: 'parameter',
      name: 'cooling'
    })
    const Ttwist = cf['switch'] ? cf['switch']['twist'] : true
    const Tcome = cf['switch'] ? cf['switch']['come'] : true
    const isreply = e.reply(
      BotApi.ImgIndex.showPuppeteer({
        path: 'defset',
        name: 'defset',
        data: {
          ...cf,
          Ttwist: Ttwist ? '开启' : '关闭',
          Tcome: Tcome ? '开启' : '关闭'
        }
      })
    )
    BotApi.User.surveySet({ e, isreply })
    return false
  }
  async adminSuper(e) {
    if (!e.isMaster) return false
    if (!this.verify(e)) return false
    const data = BotApi.ImgHelp.getboxhelp({ name: 'admin' })
    if (!data) return false
    const isreply = e.reply(BotApi.ImgCache.helpcache({ i: 0, data }))
    BotApi.User.surveySet({ e, isreply })
    return false
  }
  async boxhelp(e) {
    if (!this.verify(e)) return false
    const data = BotApi.ImgHelp.getboxhelp({ name: 'help' })
    if (!data) return false
    const isreply = e.reply(BotApi.ImgCache.helpcache({ i: 1, data }))
    BotApi.User.surveySet({ e, isreply })
    return false
  }
  async darkhelp(e) {
    if (!this.verify(e)) return false
    const data = BotApi.ImgHelp.getboxhelp({ name: 'darkhelp' })
    if (!data) return false
    const isreply = e.reply(BotApi.ImgCache.helpcache({ i: 2, data }))
    BotApi.User.surveySet({ e, isreply })
    return false
  }
}
