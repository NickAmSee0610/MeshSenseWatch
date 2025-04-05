export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use --lts
cd ui
export PORT=5921 
(npm run dev &> api.log & disown)
cd .. 
cd api
export DEV_UI_URL=http://localhost:5921
export ACCESS_KEY=X 
export PORT=5920 
(npm run dev &> ui.log & disown)
