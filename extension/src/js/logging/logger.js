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

let loggerImpl = undefined;

export function setLoggerImpl(logger) {
    loggerImpl = logger;
}

export function info(message) {
    if (loggerImpl) {
        loggerImpl.info(message);
    }
}

export function warn(message) {
    if (loggerImpl) {
        loggerImpl.warn(message);
    }
}

export function error(message) {
    if (loggerImpl) {
        loggerImpl.error(message);
    }
}
