const request = require('../helps/request')
const initPipelines = async (cookie)=> {
  //  获取文件中...
  //  参数
  const options = {
    hostname: 'flow.aliyun.com',
    path: `/flow/service/pipeline/listMyPipelines`,
    method: 'get',
    headers: {
      'content-Type': 'application/x-www-form-urlencoded',
      'cookie': cookie
    },
    params: {
      pipelineName: 'fmp',
      searchPipelineName: 'fmp',
      pageSize: 1000,
      pageStart: 0,
      pageSort: 'ID'
    }
  }
  const data = await request(options)
  let pipelines = []
  data.object.dataList.forEach(item=> {
    pipelines.push({
      status: 0,
      name: item.pipelineName.trim(),
      pipelineId: item.pipelineId
    })
  })
  return pipelines
}

module.exports = {
  initPipelines
}