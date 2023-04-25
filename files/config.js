let config = {
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