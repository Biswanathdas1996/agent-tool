@echo off
REM Open Git Bash and run git pull origin main

REM Path to Git Bash executable
set GIT_BASH_PATH=C:\Program Files\Git\git-bash.exe

REM Command to run in Git Bash
set GIT_COMMAND=git pull origin main

REM Open Git Bash and run the command, keeping the window open
set GIT_COMMAND=git pull origin main; exec bash
start "" "%GIT_BASH_PATH%" -c "%GIT_COMMAND%"

REM Open cmd and run yarn
start cmd /k "yarn"