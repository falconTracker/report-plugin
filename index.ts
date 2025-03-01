import type { Plugin, ResolvedConfig } from '@falcontracker/sdk';
import { CollectBehavior, getCurrentTraceId, UserBehavior } from './userBehavior';

interface BaseReportData {
  reportType: number;
  appId: string;
  time: number;
  markUser: string;
  markUv: string;
  markPage: string;
  url: string;
}

interface PerformanceResourceReportData extends BaseReportData {
  reportType: 1;
  performance?: Record<string, number>;
  pre_url?: string;
  screen_width: number;
  screen_height: number;
  resourceList: {
    resourceUrl: string;
    initiatorType: string;
    duration: number;
    decodedBodySize: number;
    nextHopProtocol: string;
    responseStatus: number;
  }[];
}

interface PerformanceMetricReportData extends BaseReportData {
  reportType: 1;
  metricList: Record<string, unknown>[];
}

interface ErrorReportData extends BaseReportData {
  reportType: 3;
  errorList: {
    traceId: string;
    t: number;
    n: string;
    msg: string;
    data: {
      resourceUrl?: string;
      line?: number;
      col?: number;
      target?: string;
    } | RequestData;
    behaviorList?: CollectBehavior[];
    screenRecords?: string;
  }[];
}

interface APIRequestReportData extends BaseReportData {
  reportType: 2;
  requestList: RequestData[];
}

type ReportData =
  | PerformanceResourceReportData
  | PerformanceMetricReportData
  | ErrorReportData
  | APIRequestReportData;

export interface RequestData {
  resourceUrl: string;
  decodedBodySize: number;
  duration: number;
  method: string;
  params: string;
  status: number;
  statusText: string;
  message: string;
}

let config: ResolvedConfig;
let userBehavior: UserBehavior;

export function createFalconReportPlugin(): Plugin {
  return {
    name: 'report-plugin',

    configResolved(resolved) {
      config = resolved;
      if (config.collectors?.behavior) {
        userBehavior = new UserBehavior();
      }
    },

    async load(data) {
      if (data.category === 'behavior') {
        const { type, data: behaviorData, timeStamp } = data;

        let behavior: CollectBehavior;

        switch (type) {
          case 'navigation':
            behavior = createNavigationBehavior(timeStamp, behaviorData);
            break;
          case 'ui-click':
            behavior = createUiClickBehavior(timeStamp, behaviorData);
            break;
          case 'request':
            behavior = createRequestBehavior(timeStamp, behaviorData);
            break;
          default:
            return;
        }

        userBehavior.addBehavior(behavior);
      }

      if (data.category === 'error') {
        const errorBase = {
          ...data,
          traceId: getCurrentTraceId(),
        };

        if (data.type !== 'resource') {
          return {
            ...errorBase,
            behaviorList: await userBehavior.getAndResetBehaviorStack(),
          };
        }
      }
    },

    transform(data) {
      switch (data.category) {
        case 'performance':
          return handlePerformance(data);
        case 'error':
          return handleError(data);
        case 'behavior':
          return handleBehavior(data);
        default:
          return false;
      }
    },
  };
}

function createNavigationBehavior(timeStamp: number, data: any): CollectBehavior {
  return {
    type: 'navigation',
    data: {
      from: data.from,
      to: data.to,
    },
    timeStamp,
  };
}

function createUiClickBehavior(timeStamp: number, data: any): CollectBehavior {
  return {
    type: 'ui-click',
    data: {
      chain: data?.chain || '',
    },
    timeStamp,
  };
}

function createRequestBehavior(timeStamp: number, data: any): CollectBehavior {
  return {
    type: 'request',
    data: {
      resourceUrl: data.resource.name,
      method: data.method,
      duration: data.resource.duration,
      decodedBodySize: 0,
      status: data.status,
      statusText: data.statusText,
      params: data.params,
      message: data.message,
    },
    timeStamp,
  };
}

function handlePerformance(data: any): ReportData | false {
  const reportData: ReportData = {} as ReportData;

  reportData.appId = data.appId;
  reportData.time = data.timeStamp;
  reportData.markUser = data.markUser;
  reportData.markUv = data.markUv;
  reportData.markPage = data.markPage;
  reportData.url = data.url;

  if (data.category === 'performance') {
    reportData.reportType = 1;

    if (data.type === 'resource') {
      (reportData as PerformanceResourceReportData).screen_width = data.screenWidth || 0;
      (reportData as PerformanceResourceReportData).screen_height = data.screenHeight || 0;

      if (data.timing) {
        (reportData as PerformanceResourceReportData).performance = data.timing;
        (reportData as PerformanceResourceReportData).pre_url = data.preUrl || '';
      }

      if (data.entries?.length) {
        (reportData as PerformanceResourceReportData).resourceList = (data.entries as PerformanceResourceTiming[]).map((item) => ({
          resourceUrl: item.name,
          initiatorType: item.initiatorType,
          duration: Number(item.duration.toFixed(2)) || 0,
          decodedBodySize: item.decodedBodySize || 0,
          nextHopProtocol: item.nextHopProtocol,
          responseStatus: item.responseStatus || 0,
        }));
      }
    }

    if (data.type === 'metric') {
      (reportData as PerformanceMetricReportData).metricList = [data.metric];
    }
  }

  return reportData;
}

function handleError(data: any): ReportData | false {
  const reportData: ErrorReportData = {
    appId: data.appId,
    time: data.timeStamp,
    markUser: data.markUser,
    markUv: data.markUv,
    markPage: data.markPage,
    url: data.url,
    reportType: 3,
    errorList: [],
  };

  let error: any;

  if (data.type === 'error' || data.type === 'unhandledrejection') {
    error = {
      traceId: data.traceId!,
      t: data.timeStamp,
      n: 'js',
      msg: data.message!,
      data: {
        resourceUrl: data.stackFrames![0].fileName,
        line: data.stackFrames![0].lineNumber,
        col: data.stackFrames![0].columnNumber,
      },
    };

    if (config.extra?.screenRecord && data.screenRecords) {
      error.screenRecords = data.screenRecords;
    }

    error.behaviorList = data.behaviorList;
  } else if (data.type === 'resource') {
    error = {
      traceId: data.traceId!,
      t: data.timeStamp,
      n: 'resource',
      msg: `The resource imported through ${data.target?.type} tag failed to load`,
      data: {
        target: data.target?.type,
        resourceUrl: data.target?.filename,
      },
    };
  } else if (data.type === 'request') {
    error = {
      traceId: data.traceId!,
      t: data.timeStamp,
      n: 'request',
      msg: 'Fail to fetch',
      data: {
        resourceUrl: data.data.resource.name,
        method: data.data.method,
        duration: data.data.resource.duration,
        decodedBodySize: 0,
        status: data.data.status,
        statusText: data.data.statusText,
        params: data.data.params,
        message: data.data.message
      },
    };
  }

  reportData.errorList.push(error!);

  return reportData;
}

function handleBehavior(data: any): ReportData | false {
  if (data.category === 'behavior' && data.type === 'request') {
    const reportData: APIRequestReportData = {
      appId: data.appId,
      time: data.timeStamp,
      markUser: data.markUser,
      markUv: data.markUv,
      markPage: data.markPage,
      url: data.url,
      reportType: 2,
      requestList: [mapRequestData(data.data)],
    };

    return reportData;
  }

  return false;
}

function mapRequestData(data: any): RequestData {
  const resourceDetail = data.resource;
  const decodedBodySize = resourceDetail.decodedBodySize ?? data.contentLength ?? 0;

  return {
    decodedBodySize,
    duration: Number(resourceDetail.duration.toFixed(2)) || 0,
    method: data.method,
    params: data.params,
    resourceUrl: resourceDetail.name,
    message: data.message,
    status: data.status,
    statusText: data.statusText,
  };
}