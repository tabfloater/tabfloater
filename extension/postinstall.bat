@echo off

mkdir src\\libs\\webextension-polyfill
copy node_modules\\webextension-polyfill\\dist\\*.min.js* src\\libs\\webextension-polyfill

mkdir src\\libs\\uikit
rem copy node_modules\\uikit\\dist\\js\\*.min.js src\\libs\\uikitg

sass src\\sass\\tabfloater.scss > src\\css\\generated\\uk-tabfloater.css
