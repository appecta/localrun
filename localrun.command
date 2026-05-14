#!/bin/zsh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
node "$HOME/Desktop/projects/localrun/dist/localrun.js"
