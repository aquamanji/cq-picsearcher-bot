import { globalReg } from './src/utils/global';
import { loadConfig } from './src/config';
import { version } from './package.json';
import { CQWebSocket } from 'cq-websocket';
import saucenao, { snDB } from './src/saucenao';
import whatanime from './src/whatanime';
import ascii2d from './src/ascii2d';
import CQ from './src/CQcode';
import psCache from './src/cache';
import Logger from './src/Logger';
import RandomSeed from 'random-seed';
import sendSetu from './src/plugin/setu';
import Akhr from './src/plugin/akhr';
import _ from 'lodash';
import minimist from 'minimist';
import { rmdHandler } from './src/plugin/reminder';
import broadcast from './src/broadcast';
import bilibiliHandler from './src/plugin/bilibili';
import logError from './src/logError';
import event from './src/event';
import corpus from './src/plugin/corpus';
import getGroupFile from './src/plugin/getGroupFile';
import searchingMap from './src/searchingMap';
import asyncMap from './src/utils/asyncMap';
import watchBilibili from './src/plugin/watchBilibili';
import watchBilibiliry from './src/plugin/watchBilibiliry';
import watchBilibiliDynamic from './src/plugin/watchBilibiliDynamic';
import watchTiktok from './src/plugin/watchTiktok';
import asoulRise from './src/plugin/asoulRise';
import watchAsoulSchedule from './src/plugin/watchAsoulSchedule';
const ocr = require('./src/plugin/ocr');

const bot = new CQWebSocket(global.config.cqws);
const logger = new Logger();
const rand = RandomSeed.create();


var fs = require('fs')
var path2 = require("path")
var fileList = []
var jrfileList = []
var photos = []
//遍历lt库
function walk(path1){
  let fileList1 = []
	var dirList = fs.readdirSync(path1);
	dirList.forEach(function(item){
	fileList1.push("file:///"+ path1 + item);
	});
  return fileList1;
}
fileList =  walk(path2.join(__dirname+"/src/lt/"));
jrfileList =  walk(path2.join(__dirname+"/src/jr/"));

var spadefile = "file:///"+__dirname+"/src/mp/spade.mp3"
var takeoverfile = "file:///"+__dirname+"/src/mp/takeover.mp3"

var dggbfile = "file:///"+__dirname+"/src/mp/dggb.mp4"

var asoulobj = {}//成员涨粉情况

// 全局变量
globalReg({
  bot,
  replyMsg,
  sendMsg2Admin,
  parseArgs,
  replySearchMsgs,
  sendGroupForwardMsg,
  sendprivateMsg,
  sendGroupMsg,
  watchBilibiliDynamic_exit,
  watchBilibili_exit,
  watchBilibiliry_exit,
  set_watchbili_exit,
  set_asoulobj,
  set_photos
});

// 好友请求
bot.on('request.friend', context => {
  let approve = global.config.bot.autoAddFriend;
  const answers = global.config.bot.addFriendAnswers;
  if (approve && answers.length > 0) {
    const comments = context.comment.split('\n');
    try {
      answers.forEach((ans, i) => {
        const a = /(?<=回答:).*/.exec(comments[i * 2 + 1])[0];
        if (ans !== a) approve = false;
      });
    } catch (e) {
      console.error(`${global.getTime()} 加好友请求`);
      console.error(e);
      approve = false;
    }
  }
  if (approve)
    bot('set_friend_add_request', {
      flag: context.flag,
      sub_type: 'invite',
      approve: true,
    });
});

// 加群请求
const groupAddRequests = {};
bot.on('request.group.invite', context => {
  if (global.config.bot.autoAddGroup)
    bot('set_group_add_request', {
      flag: context.flag,
      approve: true,
    });
  else groupAddRequests[context.group_id] = context.flag;
});

// 设置监听器
function setBotEventListener() {
  ['message.private', 'message.group', 'message.group.@.me'].forEach(name => bot.off(name));
  // 管理员消息
  bot.on('message.private', adminPrivateMsg);
  // 其他的
  if (global.config.bot.debug) {
    if (global.config.bot.enablePM) {
      // 私聊
      bot.on('message.private', debugPrivateAndAtMsg);
    }
    if (global.config.bot.enableGM) {
      // 群组@
      bot.on('message.group.@.me', debugPrivateAndAtMsg);
      // 群组
      bot.on('message.group', debugGroupMsg);
    }
  } else {
    if (global.config.bot.enablePM) {
      // 私聊
      bot.on('message.private', privateAndAtMsg);
    }
    if (global.config.bot.enableGM) {
      // 群组@
      bot.on('message.group.@.me', privateAndAtMsg);
      // 群组
      bot.on('message.group', groupMsg);
    }
  }
}
setBotEventListener();
event.on('reload', setBotEventListener);

// 连接相关监听
bot
  .on('socket.connecting', (wsType, attempts) => console.log(`${global.getTime()} 连接中[${wsType}]#${attempts}`))
  .on('socket.failed', (wsType, attempts) => console.log(`${global.getTime()} 连接失败[${wsType}]#${attempts}`))
  .on('socket.error', (wsType, err) => {
    console.error(`${global.getTime()} 连接错误[${wsType}]`);
    console.error(err);
  })
  .on('socket.connect', (wsType, sock, attempts) => {
    console.log(`${global.getTime()} 连接成功[${wsType}]#${attempts}`);
    if (wsType === '/api') {
      setTimeout(() => {
        sendMsg2Admin(`已上线#${attempts}`);
      }, 1000);
    }
  });

// connect
bot.connect();
console.log("是否多次运行");
// 每日任务
setInterval(() => {
  if (bot.isReady() && logger.canDoDailyJob()) {
    setTimeout(() => {
      (global.config.bot.dailyLike || []).forEach(user_id => {
        if (user_id > 0) bot('send_like', { user_id, times: 10 });
      });
    }, 60 * 1000);
  }
}, 60 * 1000);
//加入watchTiktok
watchTiktok();
watchAsoulSchedule();
//加入检测插件
var watchBilibili_exit = 0
var watchBilibiliry_exit = 0
var watchBilibiliDynamic_exit = 0
function watchbilibili_plug(){

  if(watchBilibili_exit == 0 && global.config.bot.watchBilibili.enable){
    watchBilibili_exit = 1 
    watchBilibili()
  }

  if(watchBilibiliry_exit == 0 && global.config.bot.watchBilibiliry.enable){
    watchBilibiliry_exit = 1 
    watchBilibiliry()
  }

  if(watchBilibiliDynamic_exit == 0 && global.config.bot.watchBilibiliDynamic.enable){
    watchBilibiliDynamic_exit = 1
    watchBilibiliDynamic()
  }
}

function set_watchbili_exit(strs){
  if(strs == 2){
      watchBilibiliDynamic_exit = 0
  }
  if(strs == 1){
    watchBilibili_exit = 0
  }

  if(strs == 3){
    watchBilibiliry_exit = 0
  }
}

function set_asoulobj(obj){
  asoulobj = obj;
}

function   set_photos(p){
  photos = p
}
watchbilibili_plug()
asoulRise()
// 通用处理
async function commonHandle(e, context) {
  // 忽略自己发给自己的消息
  if (context.user_id === bot._qq) return true;

  // 黑名单检测
  if (Logger.checkBan(context.user_id, context.group_id)) return true;

  // 语言库
  if (corpus(context)) return true;

  // 兼容其他机器人
  const startChar = context.message.charAt(0);
  if (startChar === '/' || startChar === '<') return true;

  // 通用指令
  if (context.message === '--help') {
    replyMsg(context, 'https://github.com/Tsuk1ko/cq-picsearcher-bot/wiki/%E5%A6%82%E4%BD%95%E9%A3%9F%E7%94%A8');
    return true;
  }
  if (context.message === '--version') {
    replyMsg(context, version);
    return true;
  }
  if (context.message === '--about') {
    replyMsg(context, `说明：asoutime -- 日程表
    asouldc --涨粉表`);
    return true;
  }
  if (context.message.includes('嘉门')) {
    replyMsg(context,CQ.img(jrfileList[getIntRand(jrfileList.length-1)]));
    return true;
  }
  if (context.message.includes('龙图')) {
    replyMsg(context,CQ.img(fileList[getIntRand(fileList.length-1)]));
    return true;
  }

  if(context.message.includes('asoultime')){

    await getAsoulScheduleArry(photos,context);
    return true;
  }

  if (context.message.includes('spade')) {
    replyMsg(context,CQ.record(spadefile));
    replyMsg(context,`休想逃之夭夭💃💃💃快进入我的怀抱🕺🕺🕺
猎人扬起嘴角☺️和骄傲😇
挣扎🏊 已是徒劳🏌️🏌️🏌️
抵抗👼 无可救💊
一张神秘的♠️
我早已🏇🏇🏇逃之夭夭↑↑↑🤡`);
    return true;
  }
  if (context.message.includes('takeoverfile')) {
    replyMsg(context,CQ.record(takeoverfile));
    replyMsg(context,`take over入坑,从此茶饭不思`);
    return true;
  }

  if(context.message.includes('asouldc')){
    console.log(asoulobj)
    replyMsg(context,`🍬涨粉报🍬
嘉然关注量：${asoulobj['嘉然'].follower}(${asoulobj['嘉然'].rise}),舰长数：${asoulobj['嘉然'].guardNum}(${asoulobj['嘉然'].guardRise})
向晚关注量：${asoulobj['向晚'].follower}(${asoulobj['向晚'].rise}),舰长数：${asoulobj['向晚'].guardNum}(${asoulobj['向晚'].guardRise})
乃琳关注量：${asoulobj['乃琳'].follower}(${asoulobj['乃琳'].rise}),舰长数：${asoulobj['乃琳'].guardNum}(${asoulobj['乃琳'].guardRise})
贝拉关注量：${asoulobj['贝拉'].follower}(${asoulobj['贝拉'].rise}),舰长数：${asoulobj['贝拉'].guardNum}(${asoulobj['贝拉'].guardRise})
珈乐关注量：${asoulobj['珈乐'].follower}(${asoulobj['珈乐'].rise}),舰长数：${asoulobj['珈乐'].guardNum}(${asoulobj['珈乐'].guardRise})`
    )
    return true;
  }

  
  if (context.message.includes('动感光波')) {
    replyMsg(context,CQ.video(dggbfile));
    return true;
  }

  // setu
  if (global.config.bot.setu.enable) {
    if (sendSetu(context, logger)) return true;
  }

  // reminder
  if (global.config.bot.reminder.enable) {
    if (rmdHandler(context)) return true;
  }

  //  反哔哩哔哩小程序
  if (await bilibiliHandler(context)) return true;

  return false;
}

// 管理员私聊消息
function adminPrivateMsg(e, context) {
  if (context.user_id !== global.config.bot.admin) return;

  const args = parseArgs(context.message);

  // 允许加群
  const group = args['add-group'];
  if (group && typeof group === 'number') {
    if (typeof groupAddRequests[context.group_id] === 'undefined') {
      replyMsg(context, `将会同意进入群${group}的群邀请`);
      // 注册一次性监听器
      bot.once('request.group.invite', context2 => {
        if (context2.group_id === group) {
          bot('set_group_add_request', {
            flag: context2.flag,
            type: 'invite',
            approve: true,
          });
          replyMsg(context, `已进入群${context2.group_id}`);
          return true;
        }
        return false;
      });
    } else {
      bot('set_group_add_request', {
        flag: groupAddRequests[context.group_id],
        type: 'invite',
        approve: true,
      });
      replyMsg(context, `已进入群${context.group_id}`);
      delete groupAddRequests[context.group_id];
    }
  }

  if (args.broadcast) {
    broadcast(parseArgs(context.message, false, 'broadcast'));
    return;
  }

  // Ban
  const { 'ban-u': bu, 'ban-g': bg } = args;
  if (bu && typeof bu === 'number') {
    Logger.ban('u', bu);
    replyMsg(context, `已封禁用户${bu}`);
  }
  if (bg && typeof bg === 'number') {
    Logger.ban('g', bg);
    replyMsg(context, `已封禁群组${bg}`);
  }

  // 明日方舟
  if (args['update-akhr'] || args['akhr-update']) {
    Akhr.updateData().then(success =>
      replyMsg(context, success ? '方舟公招数据已更新' : '方舟公招数据更新失败，请查看错误日志')
    );
  }

  // 停止程序（使用 pm2 时相当于重启）
  if (args.shutdown) process.exit();

  // 重载配置
  if (args.reload) {
    loadConfig();
  }
}

// 私聊以及群组@的处理
async function privateAndAtMsg(e, context) {
  if (await commonHandle(e, context)) {
    e.stopPropagation();
    return;
  }

  if (context.message_type === 'group') {
    try {
      const rMsgId = _.get(/^\[CQ:reply,id=([-\d]+?)\]/.exec(context.message), 1);
      if (rMsgId) {
        const { data } = await bot('get_msg', { message_id: Number(rMsgId) });
        if (data) {
          // 如果回复的是机器人的消息则忽略
          if (data.sender.user_id === bot._qq) {
            e.stopPropagation();
            return;
          }
          const imgs = getImgs(data.message);
          const rMsg = imgs
            .map(({ file, url }) => `[CQ:image,file=${CQ.escape(file, true)},url=${CQ.escape(url, true)}]`)
            .join('');
          context = { ...context, message: context.message.replace(/^\[CQ:reply,id=[-\d]+?\]/, rMsg) };
        }
      }
    } catch (error) {}
  }

  if (hasImage(context.message)) {
    // 搜图
    e.stopPropagation();
    searchImg(context);
  } else if (context.message.search('--') !== -1) {
    // 忽略
  } else if (context.message_type === 'private') {
    const dbKey = context.message === 'book' ? 'doujin' : context.message;
    const db = snDB[dbKey];
    if (db) {
      logger.smSwitch(0, context.user_id, true);
      logger.smSetDB(0, context.user_id, db);
      return `已临时切换至[${dbKey}]搜图模式√`;
    } else return global.config.bot.replys.default;
  } else {
    // 其他指令
    return global.config.bot.replys.default;
  }
}

// 调试模式
function debugPrivateAndAtMsg(e, context) {
  if (context.user_id !== global.config.bot.admin) {
    e.stopPropagation();
    return global.config.bot.replys.debug;
  }
  if (context.message_type === 'private') console.log(`${global.getTime()} 收到私聊消息 qq=${context.user_id}`);
  else console.log(`${global.getTime()} 收到群组消息 group=${context.group_id} qq=${context.user_id}`);
  console.log(debugMsgDeleteBase64Content(context.message));
  return privateAndAtMsg(e, context);
}

function debugGroupMsg(e, context) {
  if (context.user_id !== global.config.bot.admin) {
    e.stopPropagation();
    return;
  }
  console.log(`${global.getTime()} 收到群组消息 group=${context.group_id} qq=${context.user_id}`);
  console.log(debugMsgDeleteBase64Content(context.message));
  return groupMsg(e, context);
}

// 群组消息处理
async function groupMsg(e, context) {
  if ((await commonHandle(e, context)) || (await getGroupFile(context))) {
    e.stopPropagation();
    return;
  }

  // 进入或退出搜图模式
  const { group_id, user_id } = context;

  if (new RegExp(global.config.bot.regs.searchModeOn).exec(context.message)) {
    // 进入搜图
    e.stopPropagation();
    if (
      logger.smSwitch(group_id, user_id, true, () => {
        replyMsg(context, global.config.bot.replys.searchModeTimeout, true);
      })
    ) {
      replyMsg(context, global.config.bot.replys.searchModeOn, true);
    } else replyMsg(context, global.config.bot.replys.searchModeAlreadyOn, true);
  } else if (new RegExp(global.config.bot.regs.searchModeOff).exec(context.message)) {
    e.stopPropagation();
    // 退出搜图
    if (logger.smSwitch(group_id, user_id, false)) replyMsg(context, global.config.bot.replys.searchModeOff, true);
    else replyMsg(context, global.config.bot.replys.searchModeAlreadyOff, true);
  }

  // 搜图模式检测
  let smStatus = logger.smStatus(group_id, user_id);
  if (smStatus) {
    // 获取搜图模式下的搜图参数
    const getDB = () => {
      const cmd = /^(all|pixiv|danbooru|doujin|book|anime)$/.exec(context.message);
      if (cmd) return snDB[cmd[1]] || -1;
      return -1;
    };

    // 切换搜图模式
    const cmdDB = getDB();
    if (cmdDB !== -1) {
      logger.smSetDB(group_id, user_id, cmdDB);
      smStatus = cmdDB;
      replyMsg(context, `已切换至[${context.message}]搜图模式√`);
    }

    // 有图片则搜图
    if (hasImage(context.message)) {
      e.stopPropagation();
      // 刷新搜图TimeOut
      logger.smSwitch(group_id, user_id, true, () => {
        replyMsg(context, global.config.bot.replys.searchModeTimeout, true);
      });
      logger.smCount(group_id, user_id);
      searchImg(context, smStatus);
    }
  } else if (global.config.bot.repeat.enable) {
    // 复读（
    // 随机复读，rptLog得到当前复读次数
    if (
      logger.rptLog(group_id, user_id, context.message) >= global.config.bot.repeat.times &&
      getRand() <= global.config.bot.repeat.probability
    ) {
      logger.rptDone(group_id);
      // 延迟2s后复读
      setTimeout(() => {
        replyMsg(context, context.message);
      }, 2000);
    } else if (getRand() <= global.config.bot.repeat.commonProb) {
      // 平时发言下的随机复读
      setTimeout(() => {
        replyMsg(context, context.message);
      }, 2000);
    }
  }
}


/**
 * 发送日程表
 * @param {*} context 
 * @param {*} customDB 
 * @returns 
 */
async function getAsoulScheduleArry(picarr,context){
  let msg = `日程表`
  for(let picurl of picarr){
      console.log(1)
      console.log(picurl)
      msg = msg + CQ.img(picurl['img_src']) 
    }
    replyMsg(context,msg)
}

/**
 * 搜图
 *
 * @param {*} context
 * @param {number} [customDB=-1]
 * @returns
 */
async function searchImg(context, customDB = -1) {
  const args = parseArgs(context.message);
  const hasWord = word => context.message.indexOf(word) !== -1;

  // OCR
  if (args.ocr) {
    doOCR(context);
    return;
  }

  // 明日方舟
  if (hasWord('akhr') || hasWord('公招')) {
    doAkhr(context);
    return;
  }

  // 决定搜索库
  let db = snDB[global.config.bot.saucenaoDefaultDB] || snDB.all;
  if (customDB < 0) {
    if (args.all) db = snDB.all;
    else if (args.pixiv) db = snDB.pixiv;
    else if (args.danbooru) db = snDB.danbooru;
    else if (args.doujin || args.book) db = snDB.doujin;
    else if (args.anime) db = snDB.anime;
    else if (args.a2d) db = -10001;
    else if (context.message_type === 'private') {
      // 私聊搜图模式
      const sdb = logger.smStatus(0, context.user_id);
      if (sdb) {
        db = sdb;
        logger.smSwitch(0, context.user_id, false);
      }
    }
  } else db = customDB;

  // 得到图片链接并搜图
  const msg = context.message;
  const imgs = getImgs(msg);
  for (const img of imgs) {
    // 指令：获取图片链接
    if (args['get-url']) {
      replyMsg(context, img.url.replace(/\/\d+\/+\d+-/, '/0/0-').replace(/\?.*$/, ''));
      continue;
    }

    // 获取缓存
    if (psCache.enable && !args.purge) {
      const cache = psCache.get(img, db);
      if (cache) {
        const msgs = cache.map(msg => `${CQ.escape('[缓存]')} ${msg}`);
        if (msgs.length > 1 && global.config.bot.groupForwardSearchResult && context.message_type === 'group') {
          await sendGroupForwardMsg(context.group_id, msgs);
        } else await asyncMap(cache, msg => replySearchMsgs(context, `${CQ.escape('[缓存]')} ${msg}`));
        continue;
      }
    }

    // 检查搜图次数
    if (
      context.user_id !== global.config.bot.admin &&
      !logger.canSearch(context.user_id, global.config.bot.searchLimit)
    ) {
      replyMsg(context, global.config.bot.replys.personLimit, false, true);
      return;
    }

    // 可能有其他人在搜同一张图
    switch (searchingMap.put(img, db, context)) {
      case searchingMap.IS_SEARCHING:
        if (imgs.length === 1) replyMsg(context, global.config.bot.replys.searching, false, true);
        continue;
      case searchingMap.NOT_FIRST:
        continue;
    }

    const Replier = searchingMap.getReplier(img, db);
    const needCacheMsgs = [];
    let success = true;
    let snLowAcc = false;
    let useAscii2d = args.a2d;
    let useWhatAnime = db === snDB.anime;

    // saucenao
    if (!useAscii2d) {
      const snRes = await saucenao(img.url, db, args.debug || global.config.bot.debug);
      if (!snRes.success) success = false;
      if (snRes.lowAcc) snLowAcc = true;
      if (
        !useWhatAnime &&
        ((global.config.bot.useAscii2dWhenLowAcc && snRes.lowAcc && (db === snDB.all || db === snDB.pixiv)) ||
          (global.config.bot.useAscii2dWhenQuotaExcess && snRes.excess) ||
          (global.config.bot.useAscii2dWhenFailed && !success))
      ) {
        useAscii2d = true;
      }
      if (!snRes.lowAcc && snRes.msg.indexOf('anidb.net') !== -1) useWhatAnime = true;
      if (snRes.msg.length > 0) needCacheMsgs.push(snRes.msg);
      await Replier.reply(snRes.msg, snRes.warnMsg);
    }

    // ascii2d
    if (useAscii2d) {
      const { color, bovw, asErr } = await ascii2d(img.url, snLowAcc).catch(asErr => ({
        asErr,
      }));
      if (asErr) {
        const errMsg = (asErr.response && asErr.response.data.length < 50 && `\n${asErr.response.data}`) || '';
        await Replier.reply(`ascii2d 搜索失败${errMsg}`);
        console.error(`${global.getTime()} [error] ascii2d`);
        logError(asErr);
      } else {
        success = true;
        await Replier.reply(color, bovw);
        needCacheMsgs.push(color, bovw);
      }
    }

    // 搜番
    if (useWhatAnime) {
      const waRet = await whatanime(img.url, args.debug || global.config.bot.debug);
      if (!waRet.success) success = false; // 如果搜番有误也视作不成功
      await Replier.reply(...waRet.msgs);
      if (waRet.msgs.length > 0) needCacheMsgs.push(...waRet.msgs);
    }

    if (success) logger.doneSearch(context.user_id);
    Replier.end();

    // 将需要缓存的信息写入数据库
    if (psCache.enable && success) {
      psCache.set(img, db, needCacheMsgs);
    }
  }
}

function doOCR(context) {
  const msg = context.message;
  const imgs = getImgs(msg);
  let lang = null;
  const langSearch = /(?<=--lang=)[a-zA-Z]{2,3}/.exec(msg);
  if (langSearch) lang = langSearch[0];

  const handleOcrResult = ret =>
    replyMsg(context, ret.join('\n')).catch(e => {
      replyMsg(context, 'OCR识别发生错误');
      console.error(`${global.getTime()} [error] OCR`);
      console.error(e);
    });

  for (const img of imgs) {
    ocr.default(img, lang).then(handleOcrResult);
  }
}

function doAkhr(context) {
  if (global.config.bot.akhr.enable) {
    if (!Akhr.isDataReady()) {
      replyMsg(context, '数据尚未准备完成，请等待一会，或查看日志以检查数据拉取是否出错');
      return;
    }

    const msg = context.message;
    const imgs = getImgs(msg);

    const handleWords = words => {
      // fix some ...
      if (global.config.bot.akhr.ocr === 'ocr.space') words = _.map(words, w => w.replace(/冫口了/g, '治疗'));
      replyMsg(context, CQ.img64(Akhr.getResultImg(words)));
    };

    const handleError = e => {
      replyMsg(context, '词条识别出现错误：\n' + e);
      console.error(`${global.getTime()} [error] Akhr`);
      console.error(e);
    };

    for (const img of imgs) {
      ocr[global.config.bot.akhr.ocr](img, 'chs').then(handleWords).catch(handleError);
    }
  } else {
    replyMsg(context, '该功能未开启');
  }
}

/**
 * 从消息中提取图片
 *
 * @param {string} msg
 * @returns 图片URL数组
 */
function getImgs(msg) {
  const reg = /\[CQ:image,file=([^,]+),url=([^\]]+)\]/g;
  const result = [];
  let search = reg.exec(msg);
  while (search) {
    result.push({
      file: CQ.unescape(search[1]),
      url: CQ.unescape(search[2]),
    });
    search = reg.exec(msg);
  }
  return result;
}

/**
 * 判断消息是否有图片
 *
 * @param {string} msg 消息
 * @returns 有则返回true
 */
function hasImage(msg) {
  return msg.indexOf('[CQ:image') !== -1;
}


/**
 * 发送消息给群友 自己加的
 *
 * @param {string} message 消息
 */
 function sendGroupMsg(message,qqid) {
  bot('send_group_msg', {
    group_id: qqid,
    message
  });

}
/**
 * 发送消息给管理员
 *
 * @param {string} message 消息
 */
function sendMsg2Admin(message) {
  const admin = global.config.bot.admin;
  if (bot.isReady() && admin > 0 && admin !== bot._qq) {
    bot('send_private_msg', {
      user_id: admin,
      message,
    });
  }
}


/**
* 发送消息给私聊 自己加的
*
* @param {string} message 消息
*/
function sendprivateMsg(message,qqid) {
  bot('send_private_msg', {
    user_id: qqid,
    message
  });
  }

/**
 * 回复消息
 *
 * @param {*} context 消息对象
 * @param {string} message 回复内容
 * @param {boolean} at 是否at发送者
 * @param {boolean} reply 是否使用回复形式
 */
function replyMsg(context, message, at = false, reply = false) {
  if (!bot.isReady() || typeof message !== 'string' || message.length === 0) return;
  if (context.message_type !== 'private') {
    message = `${reply ? CQ.reply(context.message_id) : ''}${at ? CQ.at(context.user_id) : ''}${message}`;
  }
  const logMsg = global.config.bot.debug && debugMsgDeleteBase64Content(message);
  switch (context.message_type) {
    case 'private':
      if (global.config.bot.debug) {
        console.log(`${global.getTime()} 回复私聊消息 qq=${context.user_id}`);
        console.log(logMsg);
      }
      return bot('send_private_msg', {
        user_id: context.user_id,
        message,
      });
    case 'group':
      if (global.config.bot.debug) {
        console.log(`${global.getTime()} 回复群组消息 group=${context.group_id} qq=${context.user_id}`);
        console.log(logMsg);
      }
      return bot('send_group_msg', {
        group_id: context.group_id,
        message,
      });
    case 'discuss':
      if (global.config.bot.debug) {
        console.log(`${global.getTime()} 回复讨论组消息 discuss=${context.discuss_id} qq=${context.user_id}`);
        console.log(logMsg);
      }
      return bot('send_discuss_msg', {
        discuss_id: context.discuss_id,
        message,
      });
  }
}

/**
 * 回复搜图消息
 *
 * @param {*} context 消息对象
 * @param {string[]} msgs 回复内容
 */
function replySearchMsgs(context, ...msgs) {
  msgs = msgs.filter(msg => msg && typeof msg === 'string');
  if (msgs.length === 0) return;
  //  是否私聊回复
  if (global.config.bot.pmSearchResult) {
    switch (context.message_type) {
      case 'group':
      case 'discuss':
        if (!context.pmTipSended) {
          context.pmTipSended = true;
          replyMsg(context, '搜图结果将私聊发送', false, true);
        }
        break;
    }
    return asyncMap(msgs, msg =>
      bot('send_private_msg', {
        user_id: context.user_id,
        group_id: context.group_id ? global.config.bot.pmSearchResultTemp : null,
        message: msg,
      })
    );
  }
  return asyncMap(msgs, msg => replyMsg(context, msg, false, true));
}

/**
 * 发送合并转发
 *
 * @param {number} group_id 群号
 * @param {string[]} msgs 消息
 */
function sendGroupForwardMsg(group_id, msgs) {
  return bot('send_group_forward_msg', {
    group_id,
    messages: msgs.map(content => ({
      type: 'node',
      data: {
        name: '\u200b',
        uin: String(global.bot._qq),
        content,
      },
    })),
  });
}

/**
 * 生成随机浮点数
 *
 * @returns 0到100之间的随机浮点数
 */
function getRand() {
  return rand.floatBetween(0, 100);
}

/**
 * 生成随机整数
 *
 * @returns 0到100之间的随机整数
 */
 function getIntRand(sz) {
  return rand.intBetween(0, sz);
}

function parseArgs(str, enableArray = false, _key = null) {
  const m = minimist(
    str
      .replace(/(--\w+)(?:\s*)(\[CQ:)/g, '$1 $2')
      .replace(/(\[CQ:[^\]]+\])(?:\s*)(--\w+)/g, '$1 $2')
      .split(' '),
    {
      boolean: true,
    }
  );
  if (!enableArray) {
    for (const key in m) {
      if (key === '_') continue;
      if (Array.isArray(m[key])) m[key] = m[key][0];
    }
  }
  if (_key && typeof m[_key] === 'string' && m._.length > 0) m[_key] += ' ' + m._.join(' ');
  return m;
}

function debugMsgDeleteBase64Content(msg) {
  return msg.replace(/base64:\/\/[a-z\d+/=]+/gi, '(base64)');
}
