const { initPipelines } = require('./Core/InitPipelines')

const Pipeline = require('./Core/ClsPipeline')

const koa = require('koa')
const cors = require("koa2-cors");
const bodyParser = require('koa-body-parser')
const Router = require('koa-router')

const app = new koa()
const router = new Router({ prefix: '/v1'})

app.use(bodyParser())

app.use(cors({
  origin: (ctx)=> {
    return ctx.header.origin;
  },
  exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 5,
  credentials: true,
  withCredentials:true,
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// 错误处理中间件, 洋葱最外层
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    // 响应用户
    ctx.status = 200;
    ctx.body = {
      status: 500,
      msg: '系统错误'
    }
    ctx.app.emit('error', error); // 触发应用层级错误事件
  }
});

app.use(ctx => {
  // 抛出错误, 也可以理解为模拟错误发生
  throw new Error("未知错误");
});

// 全局错误事件监听
app.on('error', (error) => {
  console.error(error);
});

router.get('/list', async (ctx, next) => {
  const { cookie = '' } = ctx.request.query
  const res = initPipelines(cookie)
  ctx.response.body = {
    status: 200,
    list: res
  }
})

router.post('/running', async (ctx, next) => {
  const query = ctx.request.body
  new Pipeline(query)
  ctx.response.body = {
    status: 200,
    msg: '执行成功'
  }
})

app.use(router.routes())

app.listen(9923, ()=> {
  console.log('koa初体验启动成功！')
})