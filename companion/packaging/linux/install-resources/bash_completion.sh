# Copyright 2020 Balazs Gyurak
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# bash completion script for tabfloater-companion

_tabfloater_companion()
{
    local cur prev words cword
    _init_completion || return

    local _commands="register status unregister version --help"
    local _browsers="all chromium chromium-snap chrome firefox"

    case $prev in
        register|unregister)
            COMPREPLY=( $(compgen -W '$_browsers' -- "$cur") )
            ;;
        *)
            COMPREPLY=( $(compgen -W '$_commands' -- "$cur") )
            ;;
    esac
} &&
complete -F _tabfloater_companion -o default tabfloater-companion
