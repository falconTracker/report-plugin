# @falcontracker/report-plugin

将 [@falcontracker/sdk](https://github.com/falconTracker/sdk) 收集的信息适配成支持 [report-service](https://github.com/falconTracker/report-service) 接口。

## 安装

```shell
npm i @falcontracker/report-plugin --save-dev
```

## 接入到 sdk 中

```js
import { init } from '@falcontracker/sdk';
import { createFalconReportPlugin } from '@falcontracker/report-plugin';

init({
    appId: 'xxxx',
    plugins: [ createFalconReportPlugin() ]
})
```

## 数据示例

这个插件的作用就是将 @falcontracker/sdk 收集上来的数据进行转换，适配 falcontracker/report-service 服务。

### 页面性能数据示例

```js
{
  appId: 'xxx',
  time: 12345678,
  reportType: 1,
  markUser: 'ISq8gNXMBv1740628511799',
  markUv: '5wAVeIdMXt1740628511799',
  markPage: 'gt3E7cFACa1740641321522',
  url: 'http://xxx.com/b',
  pre_url: 'http://xxx.com/a',
  performance: {
    lodt: 0,
    dnst: 0,
    tcpt: 0,
    domt: 0,
    wit: 0,
    rdit: 0,
    uodt: 0,
    reqt: 0,
    andt: 0,
    radt: 0,
  },
  resourceList: [
    {
      initiatorType: 'script',
      resourceUrl: 'http://xxx.com/index.js',
      duration: 0,
      decodedBodySize: 1024,
      nextHopProtocol: 'http/1.1',
      responseStatus: 0,
    },
  ],
  metricLis: [
    {
      name: 'TTFB',
      rating: 'good',
      value: 14,
    },
  ],
}
```

### web-vitals 指标上报

```js
{
  appId: 'xxx',
  time: 12345678,
  reportType: 1,
  markUser: 'ISq8gNXMBv1740628511799',
  markUv: '5wAVeIdMXt1740628511799',
  markPage: 'gt3E7cFACa1740641321522',
  url: 'http://xxx.com/b',
  metricList: [
    {
      name: 'TTFB',
      rating: 'good',
      value: 14,
    },
  ],
}
```


### 请求数据示例

```js
{
  appId: 'xxx',
  time: 12345678,
  reportType: 2,
  markUser: 'usertokenxxx',
  markUv: 'uniqueIdxxx',
  markPage: 'gt3E7cFACa1740641321522',
  url: 'http://xxx.com/b',
  requestList: [
    {
      resourceUrl: 'http://xxx.com/api',
      method: 'GET',
      duration: 10,
      decodedBodySize: 1024,
      params: ``,
      status: 200,
      statusText: 'OK',
      message: '{"code":401,"msg":"登录状态已过期"}',
    },
  ],
};
```

### js 错误

普通的 js 错误以及 unhandledrejection 错误。

```js
{
  appId: 'xxx',
  time: 12345678,
  reportType: 3,
  markUser: 'ISq8gNXMBv1740628511799',
  markUv: '5wAVeIdMXt1740628511799',
  markPage: 'gt3E7cFACa1740641321522',
  url: 'http://xxx.com/b',
  errorList: [
    {
      traceId: '"f6042464-3713-426c-b61a-4cbf8e86a0b5"',
      msg: 'con is not defined',
      n: 'js',
      t: 12345678,
      data: {
        line: 1,
        col: 1,
        resourceUrl: 'http://xxx.com/index.js',
      },
      behaviorList: [
        // 点击
        {
          type: 'ui-click',
          traceId: '"f6042464-3713-426c-b61a-4cbf8e86a0b5"',
          data: {
            chain: 'div#id.className1.className2',
          },
          timeStamp: 12345678,
        },
        // 发送请求
        {
          type: 'request',
          traceId: '"f6042464-3713-426c-b61a-4cbf8e86a0b5"',
          data: {
            resourceUrl: 'http://xxx.com/api',
            method: 'GET',
            duration: 10,
            decodedBodySize: 1024,
            params: ``,
            status: 200,
            statusText: 'OK',
            message: '{"code":401,"msg":"登录状态已过期"}',
          },
          timeStamp: 12345678,
        },
        // 导航
        {
          type: 'navigation',
          traceId: '"f6042464-3713-426c-b61a-4cbf8e86a0b5"',
          data: {
            from: 'http://xxx.com/b',
            to: 'http://xxx.com/c',
          },
          url: 'http://xxx.com/b',
          timeStamp: 12345678,
        },
      ],
    },
  ],
};

```

@falcontracker/report-plugin 会将用户行为进行收集，不会直接上报，等到出现错误时才会将全部用户行为进行与错误一起上报，用于方便回溯错误的产生。

### 资源加载错误

```js
{
  appId: 'xxx',
  time: 12345678,
  reportType: 3,
  markUser: 'ISq8gNXMBv1740628511799',
  markUv: '5wAVeIdMXt1740628511799',
  markPage: 'gt3E7cFACa1740641321522',
  url: 'http://xxx.com/b',
  errorList: [
    {
      traceId: 'traceIdxxx',
      msg: 'The resource imported through script tag failed to load',
      n: 'resource',
      t: 12345678,
      data: {
        target: 'script',
        resourceUrl: 'http://xxx.com/wrong.js',
      },
    },
  ],
}
```

### 请求错误数据示例

```js
{
  appId: 'xxx',
  time: 12345678,
  reportType: 2,
  markUser: 'ISq8gNXMBv1740628511799',
  markUv: '5wAVeIdMXt1740628511799',
  markPage: 'gt3E7cFACa1740641321522',
  url: 'http://xxx.com/b',
  errorList: [
    {
      traceId: '"789c39e7-1c7e-43d9-9134-12c5f13af724"',
      msg: 'error',
      n: 'request',
      t: 12345678,
      data: {
        resourceUrl: 'http://xxx.com/api/',
        method: 'POST',
        duration: 0,
        decodedBodySize: 0,
        params: `{name: 'leo', password: '123'}`,
        status: -1,
        statusText: 'error',
        message: 'Failed to request',
      },
    },
  ],
}
```