const request = require('../helps/request')
const noticeMsg = require('../helps/notice')
const { aliStatus, statusList } = require("../files/config");

module.exports = class Pipeline {
  env = 'dev' // 环境
  runLastedBranch = false
  runAdmins = [ 13060870976 ] // 卡点管理员
  cookie = '' // 阿里云cookie
  xsrfToken = ''  // 阿里云x-xsrf-token
  pipelines = [] // 当前运行的流水线列表
  count = 0  // 当前流水线的计数
  robotContent = '' //  机器人信息内容
  timer = null  //  轮询定时器
  pollingTime = 6000 * 10 * 10  // 轮询时间

  // 流水线发布群通知机器人
  devRobotWebHook = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=773e9022-c8fd-484e-9d3b-30d5408f90a0'
  // 流水线卡点群通知机器人
  proRobotWebHook = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=2be9193b-c4fc-418c-bb7e-5cab1d755e73'
  constructor(props) {
    //  初始化数据
    this.env = props.env
    this.runLastedBranch = props.runLastedBranch
    this.cookie = props.cookie
    this.xsrfToken = props['x-xsrf-token']
    this.pipelines = props.list
    this.count = this.pipelines.length

    //  开始执行
    this.startRunning()
  }

  /**
   * 处理请求参数
   * @param props
   * @returns {{path: string, headers: {cookie: string, "x-xsrf-token": string, "content-Type": string}, hostname: string, method: string, params: (*|{[p: number]: boolean | number}|((level: number, strategy: number, callback: () => void) => void)|T|{})}}
   */
  handleOptions(props) {
    return {
      hostname: 'flow.aliyun.com',
      path: props.fullPath || '/ec/ajax/pipelines' + props.url,
      method: props.method || 'get',
      headers: {
        'content-Type': 'application/x-www-form-urlencoded',
        'cookie': this.cookie,
        'x-xsrf-token': this.xsrfToken
      },
      params: props.params || {}
    }
  }
  handleRobotContent(item) {
    const { msg, color } = statusList[item.status]
    return `
      >    流水线名称:  [${item.name}](https://flow.aliyun.com/pipelines/${item.pipelineId}/current)
      地址:  https://flow.aliyun.com/pipelines/${item.pipelineId}/current
      当前状态:  <font color=\"${color}\">${msg}</font>\n`
  }

  /**
   * 开始执行
   */
  startRunning = async ()=> {
    this.robotContent = `当前正在运行<font color=\"warning\">${this.pipelines.length}</font>条流水线，如下:\n\n`
    this.pipelines.forEach(item=> {
      this.historyPipeline(item)
      this.robotContent += this.handleRobotContent(item)
    })

    this.timer = setInterval(()=> {
      const promiseList = this.pipelines.map(item=> this.resultPipeline(item))
      Promise.all(promiseList).then(()=> {
        const result = this.pipelines.every(item=> item.status >= 3)
        this.sendMsg(result)
        if (result) {
          console.table(this.pipelines)
          clearInterval(this.timer)
        }
      })
    }, this.pollingTime)
  }
  /**
   * 最新一次流水线记录
   * @param item
   * @returns {Promise<void>}
   */
  lastPipeline = async (item)=> {
    if (this.runLastedBranch) {
      //  参数
      const options = this.handleOptions({
        url: `/${item.pipelineId}/instances/latest`,
        method: 'get',
        params: {
          '_input_charset': 'utf-8',
        }
      })
      const data =  await request(options)
      const context = JSON.parse(data.object.context)
      const sources = JSON.parse(context.sources)
      await this.branchPipeline(item, sources[0].data)
    }else {
      await this.runPipeline({}, item)
    }
  }
  /**
   * 获取流水线分支
   * @param item
   * @param projectId
   * @param connection
   * @param sign
   * @returns {Promise<void>}
   */
  branchPipeline = async (item, { projectId, connection, sign })=> {
    //  参数
    const options = this.handleOptions({
      fullPath: `/codeUp/api/branches`,
      method: 'get',
      params: {
        '_input_charset': 'utf-8',
        projectId: projectId,
        connectionId: connection,
        keyword: ''
      }
    })
    const data = await request(options)
    const params = {
      [sign]: data[0].name
    }
    await this.runPipeline(params, item)
  }
  /**
   * 开始运行
   * @param params
   * @param item
   */
  runPipeline = async (params, item) => {
    //  参数
    const options = this.handleOptions({
      url: `/${item.pipelineId}/execute`,
      method: 'post',
      params
    })
    await request(options)
    this.count--
    let data = {
      "msgtype": "markdown",
      "markdown": {
        "content": `${this.robotContent}`
      }
    }
    if (!this.count) {
      // 当执行的是生产指令流水线,发送卡点群通知
      if (this.env === 'pro') {
        let urls = '\n'
        let urlTemplate = 'https://flow.aliyun.com/pipelines/{pipelineId}/current'
        this.pipelines.forEach(_item => {
          urls += `\n ${ _item.name }：\n ${urlTemplate.replace('{pipelineId}', _item.pipelineId)} \n`
        })
        const config = {
          robotWebHook: this.proRobotWebHook,
          msgData: data,
          type: 'waiting',
          urls: urls,
          runAdmins: this.runAdmins
        }
        noticeMsg(config)
      }
      // 同时流水线通知群也要
      const config = {
        robotWebHook: this.devRobotWebHook,
        msgData: data,
        type: 'running',
      }
      noticeMsg(config)
    }
    console.log(`${item.name}正在执行!`)
  }

  /**
   * 取消执行流水线
   * @param item
   * @param instanceId
   */
  cancelPipeline = async (item, instanceId) => {
    //  参数
    const options = this.handleOptions({
      url: `/${item.pipelineId}/instances/${instanceId}/cancel`,
      method: 'post',
    })
    await request(options)
    await this.lastPipeline(item)
  }

  /**
   * 流水线结果
   * @param item
   * @returns {Promise<unknown>}
   */
  resultPipeline = (item) => {
    return new Promise(async (resolve)=> {
      //  参数
      const options = this.handleOptions({
        url: `/${item.pipelineId}/instances/latest`,
        method: 'get',
      })
      const data = await request(options)
      item.status = aliStatus[data.object.status]
      resolve()
    })
  }

  /**
   * 流水线执行历史
   * @param item
   */
  historyPipeline = async (item) => {
    //  参数
    const options = this.handleOptions({
      url: `/${item.pipelineId}/instances`,
      method: 'get',
      params: {
        pageStart: 0,
        pageSize: 1
      }
    })
    const data = await request(options)
    const { dataList } = data.object
    if (!dataList.length) return
    if (dataList[0].status === 'RUNNING' || dataList[0].status === 'WAITING') {
      //  取消执行
      await this.cancelPipeline(item, dataList[0].id)
    }else {
      //  直接执行
      await this.lastPipeline(item)
    }
  }

  /**
   * 发送信息
   * @param result
   */
  sendMsg(result) {
    this.robotContent = `当前正在运行<font color=\"warning\">${this.pipelines.length}</font>条流水线，如下:\n\n`

    this.pipelines.map(item=> {
      this.robotContent += this.handleRobotContent(item)
    })

    let data = {
      "msgtype": "markdown",
      "markdown": {
        "content": `${this.robotContent}`
      },
    }
    const config = {
      robotWebHook: this.devRobotWebHook,
      msgData: data,
      timer: this.timer,
      type: result? 'ended' : 'running',
    }
    noticeMsg(config)
  }
}