const axios = require("axios")
const sleep = (timeountMS) => new Promise((resolve) => {
    setTimeout(resolve, timeountMS);
  });
const asoul = {
    "向晚": "672346917",
    "贝拉": "672353429",
    "珈乐": "351609538",
    "嘉然": "672328094",
    "乃琳": "672342685"
}

const asoulobjold = {
    "向晚": new Object(),
    "贝拉": new Object(),
    "珈乐": new Object(),
    "嘉然": new Object(),
    "乃琳": new Object()
}
async function getFansFromVtbmoes(secUid){
    await sleep(1000);
    return await axios({
        url:"https://api.vtbs.moe/v1/detail/"+secUid,
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"
        }
    }).catch(e => {
        console.log('涨粉获取失败')
        return null;
      });
}
async function asoulRise(){
    for(var p in asoul){
        let res = await getFansFromVtbmoes(asoul[p])
        if(res){
            try{
                let rise = res['data']['rise']
                let follower = res['data']['follower']
                if(rise >= 0){
                    asoulobjold[p].rise = "+"+rise  
                }else{
                    asoulobjold[p].rise = rise 
                }
                asoulobjold[p].follower = follower
            }catch{
                console.log('获取涨粉时发生错误')
            }
        }
    }
    set_asoulobj(asoulobjold)
    console.log('涨粉数据更新成功')
    await sleep(60000);
}
        
export default asoulRise;