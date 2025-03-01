import { createUUID } from '@falcontracker/sdk';
import { RequestData } from './index';

export type CollectBehavior = {
  type: 'navigation';
  data: {
    from: string;
    to: string;
  };
  traceId?: string;
  timeStamp: number;
} | {
  type: 'ui-click';
  data: {
    chain: string;
  };
  traceId?: string;
  timeStamp: number;
} | {
  type: 'request';
  data: RequestData;
  traceId?: string;
  timeStamp: number;
};

const generateTraceId = () => createUUID();
let currentTraceId = generateTraceId();

export function getCurrentTraceId() {
  return currentTraceId;
}

export class UserBehavior {
  private stack: CollectBehavior[] = [];

  addBehavior(event: Omit<CollectBehavior, 'traceId' | 'timeStamp'>) {
    // 防止栈长度超过 100，超出时移除最旧的行为
    if (this.stack.length >= 100) {
      this.stack.shift();
    }

    const formattedEvent = {
      ...event,
      traceId: currentTraceId,
      timeStamp: Date.now(),
    } as CollectBehavior;

    this.stack.push(formattedEvent);
  }

  getAndResetBehaviorStack() {
    const copiedStack = JSON.parse(JSON.stringify(this.stack));
    // reset
    this.stack.length = 0;
    // update
    currentTraceId = generateTraceId();

    return copiedStack;
  }
}