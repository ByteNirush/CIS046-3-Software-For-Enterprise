import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from '../src/events/emitter.js';

describe('EventEmitter', () => {
  it('registers handlers and receives emitted events with payloads', () => {
    const emitter = new EventEmitter();
    const received = [];

    emitter.on('catch', (payload) => {
      received.push(payload);
    });

    emitter.emit('catch', { score: 1 });
    emitter.emit('catch', { score: 2 });

    assert.deepStrictEqual(received, [{ score: 1 }, { score: 2 }]);
  });

  it('unsubscribes using the returned cleanup function', () => {
    const emitter = new EventEmitter();
    let count = 0;

    const unsubscribe = emitter.on('start', () => {
      count++;
    });

    emitter.emit('start');
    assert.strictEqual(count, 1);

    unsubscribe();
    emitter.emit('start');
    assert.strictEqual(count, 1);
  });

  it('unsubscribes using off(event, handler)', () => {
    const emitter = new EventEmitter();
    let count = 0;
    const handler = () => {
      count++;
    };

    emitter.on('levelUp', handler);
    emitter.emit('levelUp', { level: 2 });
    assert.strictEqual(count, 1);

    emitter.off('levelUp', handler);
    emitter.emit('levelUp', { level: 3 });
    assert.strictEqual(count, 1);
  });

  it('supports multiple listeners for the same event independently', () => {
    const emitter = new EventEmitter();
    const calls = [];

    const un1 = emitter.on('miss', (data) => calls.push(`h1:${data.lives}`));
    emitter.on('miss', (data) => calls.push(`h2:${data.lives}`));

    emitter.emit('miss', { lives: 2 });
    assert.deepStrictEqual(calls, ['h1:2', 'h2:2']);

    un1();
    emitter.emit('miss', { lives: 1 });
    assert.deepStrictEqual(calls, ['h1:2', 'h2:2', 'h2:1']);
  });

  it('handles emitting events with no listeners without throwing', () => {
    const emitter = new EventEmitter();
    assert.doesNotThrow(() => {
      emitter.emit('unknown', { foo: 'bar' });
    });
  });

  it('handles safe unsubscription during emission', () => {
    const emitter = new EventEmitter();
    const execution = [];

    let un1;
    un1 = emitter.on('test', () => {
      execution.push('one');
      un1();
    });

    emitter.on('test', () => {
      execution.push('two');
    });

    emitter.emit('test');
    assert.deepStrictEqual(execution, ['one', 'two']);

    // Second emit: un1 is gone
    emitter.emit('test');
    assert.deepStrictEqual(execution, ['one', 'two', 'two']);
  });
});

