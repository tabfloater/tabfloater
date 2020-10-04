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

import { GoogleAnalyticsTrackingId, UsageDataToCustomDimensionMapping } from "../constants.js";
import * as env from "../environment.js";
import * as logger from "../logging/logger.js";
//TODO remove manifest perms

export const GoogleAnalytics = {
    sendEventAsync: async function (category, action, label, data) {
        logger.info(`Sending the following data to Google Analytics:
            Category: '${category}'
            Action: '${action}'
            Label: '${label}'
            Extra data: '${data ? JSON.stringify(data) : "n/a"}'`
        );

        const trackingId = (await env.isDevelopmentAsync())
            ? GoogleAnalyticsTrackingId.Development
            : GoogleAnalyticsTrackingId.Production;
        const clientId = await getClientIdAsync();
        const requestObject = buildRequestObject(trackingId, clientId, category, action, label, data);
        const message = new URLSearchParams(requestObject).toString();

        const request = new XMLHttpRequest();
        request.open("POST", "https://www.google-analytics.com/collect", true);
        request.send(message);
    }
};

export async function generateClientIdAsync() {
    await browser.storage.local.set({ googleAnalyticsClientId: uuidv4() }); // eslint-disable-line no-undef
}

async function getClientIdAsync() {
    const clientIdData = await browser.storage.local.get(["googleAnalyticsClientId"]);
    return clientIdData.googleAnalyticsClientId;
}

function buildRequestObject(trackingId, clientId, category, action, label, data) {
    const requestObject = {
        v: "1",
        aip: 1,  // anonymize IP - see https://support.google.com/analytics/answer/2763052?hl=en
        t: "event",
        ds: "add-on",
        tid: trackingId,
        cid: clientId,
        ec: category || "n/a",
        ea: action || "n/a",
        el: label || "n/a"
    };

    if (data) {
        Object.keys(data).forEach(usageDataKey => {
            if (usageDataKey in UsageDataToCustomDimensionMapping) {
                const customDimensionKey = UsageDataToCustomDimensionMapping[usageDataKey];
                requestObject[customDimensionKey] = data[usageDataKey];
            }

        });
    }

    return requestObject;
}
