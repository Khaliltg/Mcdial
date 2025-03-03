@echo off
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :8000') DO (
    taskkill /PID %%P /F
)
echo Port 8000 has been freed.