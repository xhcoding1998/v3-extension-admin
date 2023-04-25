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

router.get('/list', async (ctx, next) => {
  const query = ctx.request.query
  const res = await initPipelines(query)
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

app.use(async (ctx, next)=>{
  try {
    await next();
  } catch (error) {
    ctx.response.body = {
      status: 500,
      msg: error
    };
  }
});
app.use(router.routes())

app.listen(9923, ()=> {
  console.log('服务启动成功！')
})