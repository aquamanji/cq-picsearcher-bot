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

async function getGruadFromVtbmoes(secUid){
    return await axios({
        url:"https://api.vtbs.moe/v2/bulkGuard/"+secUid,
        method: "GET",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36"
        }
    }).catch(e => {
        console.log('舰长数获取失败')
        return null;
      });
}
async function asoulRise(){
    await asoulGuard();
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
                asoulobjold[p].guardChange = res['data']['guardChange']
                asoulobjold[p].guardNum = res['data']['guardNum']
                let guardRise = asoulobjold[p].guardNum - asoulobjold[p].guardOldNum
                if(guardRise >= 0){
                    asoulobjold[p].guardRise = "+"+guardRise 
                }else{
                    asoulobjold[p].guardRise = guardRise 
                }
            }catch{
                console.log('获取涨粉时发生错误')
            }
        }
    }
    set_asoulobj(asoulobjold)
    console.log('涨粉数据更新成功')
    await sleep(60000);
    asoulRise();
}

function getLocalDate() {
    var myDate = new Date();
    return myDate.getFullYear() + "-" + (myDate.getMonth()+1) + "-" + myDate.getDate() +" 00:00:00";
}
async function asoulGuard(){
    await sleep(1000);
    for(var p in asoul){
        let res = await getGruadFromVtbmoes(asoul[p])
        if(res){
            try{
                let data = res['data']
                let datalength = data.length
                let Nowtimestamp = new Date(getLocalDate()).getTime();
                console.log(Nowtimestamp)
               for(let i = datalength-1;i>=0;i--){
                   if(data[i].time<=Nowtimestamp){
                       asoulobjold[p].guardOldNum = data[i]['guardNum']
                       break;
                   }
               }
            }catch(e){
                console.log('获取舰长错误')
                console.log(e)
            }
        }
     
    }
}
        
export default asoulRise;