const axios = require("axios")
const sleep = (timeountMS) => new Promise((resolve) => {
    setTimeout(resolve, timeountMS);
  });
async function getAsoulSchedule(){
    return await axios({
        url:"https://api.bilibili.com/x/space/dynamic/search?keyword=%E6%97%A5%E7%A8%8B%E8%A1%A8&pn=1&ps=30&mid=703007996",
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"
        }
    }).catch(e => {
        console.log('日程表获取失败')
        return null;
      });
}


async function watchAsoulSchedule(){
    try{
    let res = await getAsoulSchedule();
    let cards = res['data']['data']['cards']
    for(let element of cards){
    
        if(element['desc']['type']==2){
            let pictures = JSON.parse(element['card'])['item']['pictures']
            set_photos(pictures)
            console.log('日程表更新成功')
            await sleep(300000)
            break;
        }
    }
    }catch(e){
        console.log(e)
    }
    watchAsoulSchedule()

}


export default watchAsoulSchedule