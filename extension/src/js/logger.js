/* eslint no-console: 0 */

import { loadOptionsAsync } from "./main.js";

export async function getLoggerAsync() {
    const options = await loadOptionsAsync();

    return {
        info: options.debug ? message => console.log(message) : () => { },
        warn: options.debug ? message => console.warn(message) : () => { },
        error: options.debug ? message => console.error(message) : () => { }
    };
}
