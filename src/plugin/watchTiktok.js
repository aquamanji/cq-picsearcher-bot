import CQ from '../CQcode';
const sleep = (timeountMS) => new Promise((resolve) => {
    setTimeout(resolve, timeountMS);
  });
const axios = require("axios")
const asoul = {
    "乃琳": "MS4wLjABAAAAxCiIYlaaKaMz_J1QaIAmHGgc3bTerIpgTzZjm0na8w5t2KTPrCz4bm_5M5EMPy92",
    "嘉然": "MS4wLjABAAAA5ZrIrbgva_HMeHuNn64goOD2XYnk4ItSypgRHlbSh1c",
    "向晚": "MS4wLjABAAAAxOXMMwlShWjp4DONMwfEEfloRYiC1rXwQ64eydoZ0ORPFVGysZEd4zMt8AjsTbyt",
    "珈乐": "MS4wLjABAAAAuZHC7vwqRhPzdeTb24HS7So91u9ucl9c8JjpOS2CPK-9Kg2D32Sj7-mZYvUCJCya",
    "贝拉": "MS4wLjABAAAAlpnJ0bXVDV6BNgbHUYVWnnIagRqeeZyNyXB84JXTqAS5tgGjAtw0ZZkv0KSHYyhP",
    "羊驼": "MS4wLjABAAAAflgvVQ5O1K4RfgUu3k0A2erAZSK7RsdiqPAvxcObn93x2vk4SKk1eUb6l_D4MX-n"
    // "主子":"MS4wLjABAAAAIbSoqnS0Nv1fu6HOtA6ThXsyGTmpWncKs5Cl8jV3ysc"
}
var qjdynamic_str = new Object();
var restart_status = new Object();
var watchBilibili_config = global.config.bot.watchBilibili
for(let element in asoul){
    console.log(element)
    qjdynamic_str[element] = "" //判断是否更新
    restart_status[element] = 0 //判断重启
}
async function getTikmsg(secUid){
    return await axios({
        url:"https://www.iesdouyin.com/web/api/v2/aweme/post/?sec_uid="+secUid+"&count=21",
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"
        }
    }).catch(e => {
        console.log('DY获取失败')
        console.log(e)
        return null;
      });
}
async function watchTiktok(){
    await sleep(1000)
    for(var element in asoul){
        let res = await getTikmsg(asoul[element])
       if(res){
                try{
                let aweme_id = res['data']['aweme_list'][0]['aweme_id']
                let desc = res['data']['aweme_list'][0]['desc']
                if(restart_status[element] === 0){
                    qjdynamic_str[element]=aweme_id;
                }
                if(qjdynamic_str[element]!=aweme_id){
                    console.log('检测到'+element+'更新')
                    qjdynamic_str[element] = aweme_id
                    let dyurl = "https://www.douyin.com/video/"+aweme_id
                    for(let prelement of watchBilibili_config['qq_private_userid']){
                        await sleep(500)
                        await global.sendprivateMsg(`${element}更新啦\n 内容：${desc}\n dy地址：${dyurl}`,prelement)
                    }
                    await sleep(2000)
                    for(let pbelement of watchBilibili_config['qq_public_groupid']){
                        console.log('进入循环')
                        await sleep(500)
                        await global.sendGroupMsg(`${element}更新啦\n内容：${desc}\n dy地址：${dyurl}`,pbelement)
                    }
                    
                }else{
                    console.log('未检测到更新')
                }
                restart_status[element]+=1
                console.log(aweme_id)
                console.log(desc)
                }catch(e){
                    console.log('发生错误')
                }
                
            }
        await sleep(60000)
    }
    watchTiktok();
        

}
export default watchTiktok;