try {
  const getUrlParams = (url) => {
    // split ?
    let urlStr = url.split('?')[1];
    if (!urlStr) return {}
    // create empty obj
    let obj = {};
    // split &
    let paramsArr = urlStr.split('&');
    for(let i = 0,len = paramsArr.length;i < len;i++){
      // split =
      let arr = paramsArr[i].split('=');
      obj[arr[0]] = arr[1];
    }
    return obj;
  }

  const requestApi = (config) => { // baseUrl
    const baseUrl = window.$nuxt.context.env.baseUrl
    const xhr = new XMLHttpRequest();
    xhr.open(config.method || 'GET', baseUrl + config.url);  // send request
    xhr.setRequestHeader('Content-Type', 'application/json');    // set request header: JSON
    xhr.send(JSON.stringify(config.data || {}));    // send

    xhr.onreadystatechange = ()=> {
      // 成功回调
    };
  }
  const {
    log_emailType, log_userId, log_orderId, log_userEmail
  } = getUrlParams(location.href)
  // email log
  if(log_emailType || log_userId || log_orderId || log_userEmail) {
    const data = {
      type: log_emailType,
        userId: log_userId,
        orderId: log_orderId,
        userEmail: log_userEmail
    }
    const callback = () => {
      return requestApi({
        url: '/emailLog',
        method: 'POST',
        data
      })
    }
    window.addEventListener('load', callback);
  }
}catch (e) {
  console.error(e)
}