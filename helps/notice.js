const https = require('https');
const { runAdmins } = require('../files/config')
const msgType = {
  error: {
    "msgtype": "text",
    "text": {
      "content": `机器人消息发送失败,请检查!`
    }
  },
  waiting: {
    "msgtype": "text",
    "text": {
      "content": "哈喽,帮忙过下以下卡点",
      "mentioned_mobile_list": runAdmins
    }
  },
  ended: {
    "msgtype": "text",
    "text": {
      "content": "上面那条流水线通知执行完啦!",
      "mentioned_mobile_list":[ "@all" ]
    }
  }
}

const noticeMsg = (robotWebHook, msgData, timer = null, type = 'running', urls = '')=> {
  //  需要卡点，修改msgData发到卡点群
  if (type === 'waiting') {
    msgType[type].text.content += urls
    msgData = msgType[type]
  }
  const req = https.request(robotWebHook,
    {
      method: 'post'
    }, (res) => {
      res.setEncoding('utf8');
      let store = "";
      res.on('data', (d) => {
        store += d
      });
      res.on("end", ()=> {
        let  data = null
        if (store) {
          data = JSON.parse(store)
        }
        if (timer && data && data.errcode !== 0) {
          timer && clearInterval(timer)
          noticeMsg(robotWebHook, msgType['error'])
        }
        //  运行成功，额外发一条通知@全部人
        if (type === 'ended') {
          noticeMsg(robotWebHook, msgType[type], timer)
        }
      })
    }).on('error', (e) => {
    console.error(e);
  });

  req.end(JSON.stringify(msgData));
}

module.exports = noticeMsg