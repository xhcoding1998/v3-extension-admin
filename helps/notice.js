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
      "content": "",
      "mentioned_mobile_list": []
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

const noticeMsg = (
  {
    robotWebHook = '', msgData = {}, timer = null,
    type = 'running', urls = '',  runAdmins = []
  })=> {
  //  需要卡点，修改msgData发到卡点群
  if (type === 'waiting') {
    msgType[type].text.content = "哈喽,帮忙过下以下卡点" + urls
    msgData = msgType[type]
    msgData.text.mentioned_mobile_list = runAdmins
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
          const config = {
            robotWebHook,
            msgData: msgType['error'],
          }
          noticeMsg(config)
        }
        //  运行成功，额外发一条通知@全部人
        if (type === 'ended') {
          // const config = {
          //   robotWebHook,
          //   msgData: msgType[type],
          //   timer
          // }
          // noticeMsg(config)
        }
      })
    }).on('error', (e) => {
    console.error(e);
  });

  req.end(JSON.stringify(msgData));
}

module.exports = noticeMsg