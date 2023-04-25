const https = require('https');
const url = require('url')

//  请求hook封装
const request = (options, callback)=> {
  return new Promise((resolve, reject) => {
    options.agent = new https.Agent({
      rejectUnauthorized: false
    })
    const req = https.request(options, (res) => {
      res.setEncoding('utf8');
      let store = "";
      //  对data数据进行累加（因为data是字符流的形式分段返回的）
      res.on('data', (d) => {
        store += d
      });
      // 监听到所有数据返回完成，对store（完整数据）进行解析为对象
      res.on("end", ()=> {
        let  data = null
        if (store) {
          data = JSON.parse(store)
        }
        if (!data) {
          reject('系统错误')
        }
        resolve(data)
      })
    });

    req.on('error', (e) => {
      console.log(e);
    });
    //  如果没有传参，给默认值防止报错
    if (!options.data) {
      options.data = {}
    }
    if (!options.data) {
      options.params = {}
    }
    req.path += url.format({ query: options.params })
    req.end(JSON.stringify(options.data));
  })
}

module.exports = request