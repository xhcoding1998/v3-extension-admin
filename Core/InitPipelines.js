const request = require('../helps/request')
const initPipelines = async (query)=> {
  //  获取文件中...
  //  参数
  const options = {
    hostname: 'flow.aliyun.com',
    path: `/flow/service/pipeline/listMyPipelines`,
    method: 'get',
    headers: {
      'content-Type': 'application/x-www-form-urlencoded',
      'cookie': query.cookie
    },
    params: {
      pipelineName: query.keywords || '',
      searchPipelineName: query.keywords || '',
      pageSize: 1000,
      pageStart: 0,
      pageSort: 'ID'
    }
  }
  const data = await request(options)
  let pipelines = []
  data.object.dataList.forEach(item=> {
    const sources = JSON.parse(item.extendInfoVo.sources)
    pipelines.push({
      status: 0,
      name: item.pipelineName.trim(),
      pipelineId: item.pipelineId,
      projectId: sources[0].data.projectId,
      connectionId: sources[0].data.connection,
    })
  })
  return pipelines
}

const branchPipelines = async (query)=> {
  //  获取文件中...
  //  参数
  const options = {
    hostname: 'flow.aliyun.com',
    path: `/codeUp/api/branches`,
    method: 'get',
    headers: {
      'content-Type': 'application/x-www-form-urlencoded',
      'cookie': query.cookie
    },
    params: {
      projectId: query.projectId || '',
      connectionId: query.connection || '',
    }
  }
  const data = await request(options)
  return data.object
}

module.exports = {
  initPipelines,
  branchPipelines
}