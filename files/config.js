let config = {
  env: 'dev',
  runAdmins: [ 13060870976 ], //  流水线管理员(可通过卡点的管理员)
  runCount: 0, // 执行次数
  pollingTime: 6000 * 10 * 10 , // 轮询查询接口间隔时间,单位: 分
  firstTip: false,
  //  机器人webhook地址
  devRobotWebHook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=773e9022-c8fd-484e-9d3b-30d5408f90a0', // 通知
  proRobotWebHook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=2be9193b-c4fc-418c-bb7e-5cab1d755e73', //卡点
  //  机器人发送信息的content内容
  robotContent: '',
  //  状态列表
  aliStatus: {
    WAITING: 1,
    RUNNING: 2,
    SUCCESS: 3,
    FAIL: 4
  },
  statusList: {
    0: {
      color: 'comment',
      msg: '等待运行'
    },
    1: {
      color: 'warning',
      msg: '等待通过卡点'
    },
    2: {
      color: 'comment',
      msg: '运行中...'
    },
    3: {
      color: 'info',
      msg: '运行成功!'
    },
    4: {
      color: 'warning',
      msg: '运行失败!'
    }
  }
}

module.exports = config