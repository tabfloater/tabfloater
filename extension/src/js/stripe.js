/*
 * Copyright 2023 SNSJ LLC
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

const stripe = require('stripe')('sk_test_51Kv37gL873epB8fndzKYmuC0J8LP69H3dPhamCdMseyQIQjQiSscCWsvqjPoDz156kzczYuXIQFR3NhKMFjfyEkM00wEMtDJKR');

const elements = stripe.elements();
const card = elements.create('card');
card.mount('#card-element');
const form = document.getElementById('payment-form');
form.addEventListener('submit', function(event) {
    event.preventDefault();

    stripe.createToken(card).then(function(result) {
        if (result.error) {
            // Inform the user if there was an error
            var errorElement = document.getElementById('card-errors');
            errorElement.textContent = result.error.message;
        } else {
            // Send the token to your server
            stripeTokenHandler(result.token);
        }
    });
});

stripe.charges.create({
    amount: 0.99,
    currency: 'usd',
    description: 'Example charge',
    source: result.token,
}, function() {
    // asynchronously called
});