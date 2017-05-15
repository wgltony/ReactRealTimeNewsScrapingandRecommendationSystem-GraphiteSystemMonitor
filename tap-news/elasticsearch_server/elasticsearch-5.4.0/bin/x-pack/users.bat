@echo off
PUSHD "%~dp0"
CALL "%~dp0.in.bat" org.elasticsearch.xpack.security.authc.file.tool.UsersTool %*
POPD