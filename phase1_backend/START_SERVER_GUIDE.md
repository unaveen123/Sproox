# 🚀 Backend Server Startup Guide

## Problem
Your backend server is NOT running. That's why you're getting CORS errors.

## Quick Start (Windows)

### Option 1: Use the Batch File (Easiest)
1. Navigate to: `c:\Users\navee\Downloads\naveen\phase1_backend\`
2. Double-click: `start_server.bat`
3. A command window will open showing the server logs
4. Wait until you see: "Application startup complete"
5. Keep this window open while using the app

### Option 2: Manual Start
1. Open Command Prompt (cmd)
2. Run these commands:
```cmd
cd c:\Users\navee\Downloads\naveen\phase1_backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Verify Server is Running

### Method 1: Check Server Script
1. Double-click: `check_server.bat`
2. Should show: "✅ Backend server is RUNNING"

### Method 2: Open Browser
1. Go to: http://127.0.0.1:8000
2. Should see: `{"message": "Seat Booking Backend Running"}`

### Method 3: Check API Docs
1. Go to: http://127.0.0.1:8000/docs
2. Should see FastAPI interactive documentation

## Common Issues

### Issue 1: "uvicorn: command not found"
**Solution:**
```cmd
pip install uvicorn
```

### Issue 2: "No module named 'fastapi'"
**Solution:**
```cmd
pip install -r requirements_clean.txt
```

### Issue 3: Port 8000 already in use
**Solution:**
```cmd
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use a different port
python -m uvicorn app.main:app --reload --port 8001
```

### Issue 4: Database connection error
**Solution:**
- Make sure PostgreSQL is running
- Check your `.env` file has correct database credentials

## What You Should See

When the server starts successfully, you'll see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXX] using WatchFiles
INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Debug Logs

After starting the server, when you access the seats page, you should see:
```
🔍 DEBUG: Fetching seats for location=..., slot=..., date=...
✅ Slot found: screen_id=..., movie=...
📊 Found X seats for screen ...
🔒 X seats already booked
✅ Returning X seats
```

## Testing the API

Once server is running, test with curl:
```cmd
curl http://127.0.0.1:8000/

curl http://127.0.0.1:8000/user/locations/{location_id}/debug-theater-data
```

## Keep Server Running

⚠️ **IMPORTANT:** Keep the command window open while using the application!
- Closing the window = stopping the server
- Stopping the server = CORS errors in frontend

## Next Steps

1. ✅ Start the backend server
2. ✅ Verify it's running (check http://127.0.0.1:8000)
3. ✅ Refresh your frontend (http://localhost:5173)
4. ✅ Try accessing the seats page again
5. ✅ Check backend console for debug logs

## Still Having Issues?

If the server starts but you still get errors:
1. Check the backend console for error messages
2. Look for the debug logs (🔍, ✅, 📊, etc.)
3. Click "🔍 Debug Data" button in the UI
4. Check browser console for the response
