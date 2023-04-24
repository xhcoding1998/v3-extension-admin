const requestHook = require('../helps/request')
const noticeMsg = require('../helps/notice')

let {
  runCount, pollingTime, devRobotWebHook,
  proRobotWebHook, robotContent, statusList,
  aliStatus
} = require('../files/config')

let env = 'dev'
let cookie = ''
let xsrfToken = ''
let runPipelineIds = []

// 运行流水线
const runPipeline = (item)=> {
  //  参数
  const options = {
    hostname: 'flow.aliyun.com',
    path: `/ec/ajax/pipelines/${item.pipelineId}/execute`,
    method: 'post',
    headers: {
      'content-Type': 'application/x-www-form-urlencoded',
      'cookie': cookie,
      'x-xsrf-token': xsrfToken
    }
  }
  requestHook(options, ()=> {
    runCount++
    let data = {
      "msgtype": "markdown",
      "markdown": {
        "content": `${robotContent}`
      }
    }
    //  当执行的是生产指令流水线,发送卡点群通知
    if (env === 'pro') {
      let urls = '\n'
      let urlTemplate = 'https://flow.aliyun.com/pipelines/{pipelineId}/current'
      runPipelineIds.forEach(_item => {
        urls += `\n ${ _item.name }：\n ${urlTemplate.replace('{pipelineId}', _item.pipelineId)} \n`
      })
      noticeMsg(proRobotWebHook, data, null, 'waiting', urls)
    }
    // 同时流水线通知群也要
    noticeMsg(devRobotWebHook, data, null, 'running')
    console.log(`${item.name}正在执行!`)
  })
}

// 取消流水线
const cancelPipeline = (item, instanceId)=> {
  //  参数
  const options = {
    hostname: 'flow.aliyun.com',
    path: `/ec/ajax/pipelines/${item.pipelineId}/instances/${instanceId}/cancel`,
    method: 'post',
    headers: {
      'content-Type': 'application/x-www-form-urlencoded',
      'cookie': cookie,
      'x-xsrf-token': xsrfToken
    }
  }
  requestHook(options, (data)=> {
    runPipeline(item)
  })
}

// 获取流水线结果
const resultPipeline = async (item, timer)=> {
  return new Promise((resolve)=> {
    //  参数
    const options = {
      hostname: 'flow.aliyun.com',
      path: `/ec/ajax/pipelines/${item.pipelineId}/instances/latest`,
      method: 'get',
      headers: {
        'content-Type': 'application/x-www-form-urlencoded',
        'cookie': cookie,
        'x-xsrf-token': xsrfToken
      },
    }
    requestHook(options, (data)=> {
      item.status = aliStatus[data.object.status]
      resolve()
    })
  })
}

// 获取流水线历史
const historyPipeline = (item)=> {
  //  参数
  const options = {
    hostname: 'flow.aliyun.com',
    path: `/ec/ajax/pipelines/${item.pipelineId}/instances`,
    method: 'get',
    headers: {
      'content-Type': 'application/x-www-form-urlencoded',
      'cookie': cookie,
      'x-xsrf-token': xsrfToken
    },
    params: {
      pageStart: 0,
      pageSize: 1
    }
  }

  requestHook(options, (data)=> {
    const { dataList } = data.object
    if (!dataList.length) return
    if (dataList[0].status === 'RUNNING' || dataList[0].status === 'WAITING') {
      //  取消执行
      cancelPipeline(item, dataList[0].id)
    }else {
      //  直接执行
      runPipeline(item)
    }
  })
}

//  开始运行
const startRunning = (query)=> {
  env = query.env
  cookie = query.cookie
  xsrfToken = query['x-xsrf-token']
  const list = query.list
  runPipelineIds = query.list.map(it=> it.pipelineId)

  robotContent = `当前正在运行<font color=\"warning\">${runPipelineIds.length}</font>条流水线，如下:\n\n`
  runPipelineIds = runPipelineIds.map(item=> {
    item = list.find(it=> it.pipelineId === item)
    historyPipeline(item)
    const { msg, color } = statusList[item.status]
    robotContent += `
    >    流水线名称:  [${item.name}](https://flow.aliyun.com/pipelines/${item.pipelineId}/current)
    地址:  https://flow.aliyun.com/pipelines/${item.pipelineId}/current
    当前状态:  <font color=\"${color}\">${msg}</font>\n`

    return item
  })

  const pipelines = runPipelineIds
  const timer = setInterval(()=> {
    const promiseList = pipelines.map(item=> resultPipeline(item, timer))
    Promise.all(promiseList).then(()=> {
      const result = pipelines.every(item=> item.status >= 3)
      sendMsg(timer, result, pipelines)
      if (result) {
        console.table(pipelines)
        clearInterval(timer)
      }
    })
  }, pollingTime)
}

const sendMsg =(timer, result, pipelines)=> {
  robotContent = `当前正在运行<font color=\"warning\">${pipelines.length}</font>条流水线，如下:\n\n`

  pipelines.map(item=> {
    const { msg, color } = statusList[item.status]
    robotContent += `
     >    流水线名称:  [${item.name}](https://flow.aliyun.com/pipelines/${item.pipelineId}/current)
    地址:  https://flow.aliyun.com/pipelines/${item.pipelineId}/current
    当前状态:  <font color=\"${color}\">${msg}</font>\n`
  })

  let data = {
    "msgtype": "markdown",
    "markdown": {
      "content": `${robotContent}`
    },
  }

  noticeMsg(devRobotWebHook, data, timer, result? 'ended' : 'running')
}

module.exports = {
  startRunning
}