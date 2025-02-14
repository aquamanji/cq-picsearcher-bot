import { jsonc } from 'jsonc';
import { resolve } from 'path';
import deepFreeze from 'deep-freeze';
import event from './event';

const CONFIG_PATH = resolve(__dirname, '../config.jsonc');
const DEFAULT_CONFIG_PATH = resolve(__dirname, '../config.default.jsonc');

const isObject = obj => typeof obj === 'object' && !Array.isArray(obj);

const migration = (obj, oldKey, newKey) => {
  if (oldKey in obj && !(newKey in obj)) {
    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
  }
};

const STRING_TO_ARRAY_KEYS = new Set([
  'saucenaoHost',
  'saucenaoApiKey',
  'whatanimeHost',
  'whatanimeToken',
  'ascii2dHost',
]);

function recursiveCopy(c, dc) {
  for (const key in dc) {
    if (STRING_TO_ARRAY_KEYS.has(key)) {
      const defaultVal = [dc[key]].filter(val => val);
      if (typeof c[key] === 'string') c[key] = c[key] ? [c[key]] : defaultVal;
      else if (Array.isArray(c[key])) {
        c[key] = c[key].filter(val => typeof val === 'string' && val);
        if (!c[key].length) c[key] = defaultVal;
      } else c[key] = defaultVal;
      continue;
    }
    if (isObject(c[key]) && isObject(dc[key])) recursiveCopy(c[key], dc[key]);
    else if (typeof c[key] === 'undefined' || typeof c[key] !== typeof dc[key]) c[key] = dc[key];
  }
}

function loadJSON(path) {
  try {
    return jsonc.readSync(path);
  } catch (e) {
    const { code, message } = e;
    let msg = '';

    if (code === 'ENOENT') {
      msg = `ERROR: 找不到配置文件 ${e.path}`;
    } else if (message && message.includes('JSON')) {
      msg = `ERROR: 配置文件 JSON 格式有误\n${message}`;
    } else msg = `${e}`;

    console.error(global.getTime(), msg);

    global.sendMsg2Admin(msg);
  }
  return null;
}

export function loadConfig(init = false) {
  const conf = loadJSON(CONFIG_PATH);
  const dConf = loadJSON(DEFAULT_CONFIG_PATH);

  if (!(conf && dConf)) return;

  // 配置迁移
  if ('picfinder' in conf && !('bot' in conf)) {
    conf.bot = conf.picfinder;
    delete conf.picfinder;
  }
  if ('setu' in conf.bot) {
    if (typeof conf.bot.setu.antiShielding === 'boolean') {
      conf.bot.setu.antiShielding = Number(conf.bot.setu.antiShielding);
    }
  }
  migration(conf.bot, 'saucenaoHideImgWhenLowAcc', 'hideImgWhenLowAcc');
  migration(conf.bot, 'antiBiliMiniApp', 'bilibili');

  recursiveCopy(conf, dConf);
  deepFreeze(conf);
  global.config = conf;

  if (init) {
    event.emit('init');
    console.log(global.getTime(), '配置已加载');
  } else {
    event.emit('reload');
    console.log(global.getTime(), '配置已重载');
    global.sendMsg2Admin('配置已重载');
  }
}

loadConfig(true);
