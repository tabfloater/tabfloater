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

#include <string>

/**
 * Sets a window as a modeless dialog of another window. A modeless dialog is
 * a window that does not block interaction with its owner window, but always
 * stays on top of the owner window. The modeless dialog window does not have
 * a taskbar entry and moves together with its owner. For example, if the
 * owner window is minimized, the dialog window is minimized as well.
 *
 * The windows are matched by title prefix. Any window that starts with the
 * specified arguments are matched. If there are more than one window that has
 * the same prefix title, only one is picked nondeterministically.
 *
 * @param windowTitlePrefix the prefix title of the window that should be set as modeless dialog
 * @param ownerWindowTitlePrefix the prefix title of the window that should own the dialog
 */
void setAsModelessDialog(std::string windowTitlePrefix, std::string ownerWindowTitlePrefix);
