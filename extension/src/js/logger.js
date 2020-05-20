/*
 * Copyright 2020 Balazs Gyurak
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
