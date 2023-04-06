import { BotApi, GameApi, plugin, Super } from "../../../model/api/api.js";
export class BoxModify extends plugin {
  constructor() {
    super(
      Super({
        rule: [
          {
            reg: "^#改名.*$",
            fnc: "changeName",
          },
          {
            reg: "^#设置道宣.*$",
            fnc: "changeAutograph",
          },
        ],
      })
    );
  }
  changeName = async (e) => {
    if (!e.isGroup || e.user_id == 80000000) return false ;
    const { whitecrowd, blackid } = await GameApi.DefsetUpdata.getConfig({ app: "parameter", name: "namelist" });
    if (whitecrowd.indexOf(e.group_id) == -1) return false ;
    if (blackid.indexOf(e.user_id) != -1) return false ;
    if (!(await GameApi.GameUser.existUserSatus({ UID: e.user_id }))) {
      e.reply("已死亡");
      return false;
    }
    const { MSG } = await GameApi.GamePublic.Go({ UID: e.user_id });
    if (MSG) {
      e.reply(MSG);
      return false;
    }
    const UID = e.user_id;
    const lingshi = 5;
    let new_name = e.msg.replace("#改名", "");
    if (new_name.length == 0) {
      return false;
    }
    const keyname = [
      "尼玛",
      "妈的",
      "他妈",
      "卧槽",
      "操",
      "操蛋",
      "麻痹",
      "傻逼",
      "妈逼",
    ];
    keyname.forEach((item) => {
      new_name = new_name.replace(item, "");
    });
    if (new_name.length > 8) {
      e.reply("这名可真是稀奇");
      return false;
    }
    const thing = await GameApi.GameUser.userBagSearch({
      UID,
      name: "下品灵石",
    });
    if (!thing || thing.acount < lingshi) {
      e.reply(`似乎没有${lingshi}*[下品灵石]`);
      return false;
    }
    const CDID = "3";
    const now_time = new Date().getTime();
    const cf = GameApi.DefsetUpdata.getConfig({
      app: "parameter",
      name: "cooling",
    });
    const CDTime = cf["CD"]["Name"] ? cf["CD"]["Name"] : 5;
    const { CDMSG } = await GameApi.GamePublic.cooling({ UID, CDID });
    if (CDMSG) {
      e.reply(CDMSG);
      return false;
    }
    await redis.set(`xiuxian:player:${UID}:${CDID}`, now_time);
    await redis.expire(`xiuxian:player:${UID}:${CDID}`, CDTime * 60);
    await GameApi.GameUser.userBag({
      UID,
      name: "下品灵石",
      ACCOUNT: -lingshi,
    });
    const life = await GameApi.UserData.listActionInitial({
      NAME: "life",
      CHOICE: "user_life",
      INITIAL: [],
    });
    life.forEach((item) => {
      if (item.qq == UID) {
        item.name = new_name;
      }
    });
    await GameApi.UserData.listAction({
      NAME: "life",
      CHOICE: "user_life",
      DATA: life,
    });
    const { path, name, data } = await GameApi.Information.userDataShow({
      UID: e.user_id,
    });
    const isreply = await e.reply(
      await BotApi.ImgIndex.showPuppeteer({ path, name, data })
    );
    await BotApi.User.surveySet({ e, isreply });
    return false;
  };
  changeAutograph = async (e) => {
    
    if (!e.isGroup || e.user_id == 80000000) return false ;
    const { whitecrowd, blackid } = await GameApi.DefsetUpdata.getConfig({ app: "parameter", name: "namelist" });
    if (whitecrowd.indexOf(e.group_id) == -1) return false ;
    if (blackid.indexOf(e.user_id) != -1) return false ;
    if (!(await GameApi.GameUser.existUserSatus({ UID: e.user_id }))) {
      e.reply("已死亡");
      return false;
    }
    const { MSG } = await GameApi.GamePublic.Go({ UID: e.user_id });
    if (MSG) {
      e.reply(MSG);
      return false;
    }
    const UID = e.user_id;
    const player = GameApi.UserData.listAction({
      NAME: UID,
      CHOICE: "user_player",
    });
    let new_msg = e.msg.replace("#设置道宣", "");
    new_msg = new_msg.replace(" ", "");
    const keyname = [
      "尼玛",
      "妈的",
      "他妈",
      "卧槽",
      "操",
      "操蛋",
      "麻痹",
      "傻逼",
      "妈逼",
    ];
    keyname.forEach((item) => {
      new_msg = new_msg.replace(item, "");
    });
    if (new_msg.length == 0 || new_msg.length > 50) {
      e.reply("请正确设置,且道宣最多50字符");
      return false;
    }
    const CDID = "4";
    const now_time = new Date().getTime();
    const cf = GameApi.DefsetUpdata.getConfig({
      app: "parameter",
      name: "cooling",
    });
    const CDTime = cf["CD"]["Autograph"] ? cf["CD"]["Autograph"] : 5;
    const { CDMSG } = await GameApi.GamePublic.cooling({ UID, CDID });
    if (CDMSG) {
      e.reply(CDMSG);
      return false;
    }
    await redis.set(`xiuxian:player:${UID}:${CDID}`, now_time);
    await redis.expire(`xiuxian:player:${UID}:${CDID}`, CDTime * 60);
    player.autograph = new_msg;
    await GameApi.UserData.listAction({
      NAME: UID,
      CHOICE: "user_player",
      DATA: player,
    });
    const { path, name, data } = await GameApi.Information.userDataShow({
      UID: e.user_id,
    });
    const isreply = await e.reply(
      await BotApi.ImgIndex.showPuppeteer({ path, name, data })
    );
    await BotApi.User.surveySet({ e, isreply });
    return false;
  };
}
