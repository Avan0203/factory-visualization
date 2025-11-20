/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-11-20 11:16:15
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-11-20 11:18:06
 * @FilePath: /factory-visualization/src/shard/event.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
class EventListener {
    private events: Map<string, Function[]> = new Map();

    on(event: string, callback: Function): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)?.push(callback);
    }

    off(event: string, callback: Function): void {
        if (this.events.has(event)) {
            this.events.get(event)?.filter((cb) => cb !== callback);
        }
    }

    emit(event: string, ...args: any[]): void {
        if (this.events.has(event)) {
            this.events.get(event)?.forEach((callback) => callback(...args));
        }
    }

    clear(event: string): void {
        this.events.delete(event);
    }

    clearAll(): void {
        this.events.clear();
    }
}

export default EventListener;