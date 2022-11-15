@echo off

mkdir src\\libs\\webextension-polyfill
copy node_modules\\webextension-polyfill\\dist\\*.min.js* src\\libs\\webextension-polyfill

mkdir src\\libs\\uikit
copy node_modules\\uikit\\dist\\js\\*.min.js src\\libs\\uikit

mkdir src\\libs\\uuid
copy node_modules\\uuid\\dist\\umd\\uuidv4.min.js src\\libs\\uuid

sass src\\sass\\tabfloater.scss > src\\css\\generated\\uk-tabfloater.css
pause
