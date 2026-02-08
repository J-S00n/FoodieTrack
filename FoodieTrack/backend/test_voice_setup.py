#!/usr/bin/env python
"""
Test script to verify audio-to-ElevenLabs pipeline is set up correctly.

Usage:
  cd backend
  python test_voice_setup.py
"""

import os
import sys
from pathlib import Path

def check_env_file():
    """Check if .env file exists and has required keys"""
    print("\n" + "="*60)
    print("1. Checking .env file...")
    print("="*60)
    
    env_path = Path(".env")
    if not env_path.exists():
        print("❌ .env file NOT found in backend/")
        print("   → Create it with: cp .env.example .env")
        print("   → Or use: AUDIO_SETUP_GUIDE.md for details")
        return False
    
    print("✅ .env file exists")
    
    # Check for required keys
    with open(env_path) as f:
        content = f.read()
    
    required_keys = [
        "ELEVENLABS_API_KEY",
        "GEMINI_API_KEY",
        "AUTH0_DOMAIN",
    ]
    
    found_all = True
    for key in required_keys:
        if key in content:
            # Check if it's actually set
            for line in content.split("\n"):
                if line.startswith(key + "="):
                    value = line.split("=", 1)[1].strip()
                    if value and not value.endswith("_here"):
                        print(f"✅ {key} is configured")
                    else:
                        print(f"⚠️  {key} is placeholder - needs real value")
                        found_all = False
        else:
            print(f"❌ {key} not found in .env")
            found_all = False
    
    return found_all


def check_imports():
    """Check if required Python packages are installed"""
    print("\n" + "="*60)
    print("2. Checking Python dependencies...")
    print("="*60)
    
    required_packages = {
        "fastapi": "FastAPI web framework",
        "uvicorn": "ASGI server",
        "httpx": "HTTP client",
        "google.genai": "Google Gemini API",
        "pydantic": "Data validation",
        "sqlmodel": "Database ORM",
        "jwt": "JWT token handling",
    }
    
    all_installed = True
    for package, description in required_packages.items():
        try:
            __import__(package)
            print(f"✅ {package:20} - {description}")
        except ImportError:
            print(f"❌ {package:20} - NOT installed")
            all_installed = False
    
    return all_installed


def check_routes():
    """Check if voice route is properly registered"""
    print("\n" + "="*60)
    print("3. Checking FastAPI routes...")
    print("="*60)
    
    try:
        from main import app
        
        # List all routes
        routes = [route.path for route in app.routes]
        
        if "/voice/analyze" in routes:
            print("✅ /voice/analyze - Voice endpoint registered")
        else:
            print("❌ /voice/analyze - NOT found")
            print(f"   Available routes: {routes}")
            return False
        
        if "/preferences" in routes:
            print("✅ /preferences - Preferences endpoint registered")
        else:
            print("⚠️  /preferences - NOT found")
        
        return True
    except Exception as e:
        print(f"❌ Error checking routes: {e}")
        return False


def check_database():
    """Check if database exists and has tables"""
    print("\n" + "="*60)
    print("4. Checking database setup...")
    print("="*60)
    
    try:
        import sqlite3
        
        db_path = Path("foodietrack.db")
        if not db_path.exists():
            print("⚠️  Database not created yet")
            print("   → It will be created when backend starts")
            return True
        
        print("✅ foodietrack.db exists")
        
        conn = sqlite3.connect("foodietrack.db")
        cursor = conn.cursor()
        
        # Check for preferences table
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='preferences'"
        )
        if cursor.fetchone():
            print("✅ preferences table exists")
            
            # Check record count
            cursor.execute("SELECT COUNT(*) FROM preferences")
            count = cursor.fetchone()[0]
            print(f"   → Currently {count} preferences saved")
        else:
            print("⚠️  preferences table not found yet")
        
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Database error: {e}")
        return False


def check_voice_service():
    """Check if voice service can be imported"""
    print("\n" + "="*60)
    print("5. Checking voice service...")
    print("="*60)
    
    try:
        from services.voice_service import (
            transcribe_audio,
            analyze_with_gemini,
            process_voice,
            validate_audio_input,
        )
        
        print("✅ transcribe_audio - imports OK")
        print("✅ analyze_with_gemini - imports OK")
        print("✅ process_voice - imports OK")
        print("✅ validate_audio_input - imports OK")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False


def main():
    """Run all checks"""
    print("\n" + "🎤 " + "="*56 + " 🎤")
    print("   FoodieTrack Audio-to-ElevenLabs Setup Verification")
    print("🎤 " + "="*56 + " 🎤\n")
    
    checks = [
        ("Environment Variables", check_env_file),
        ("Python Dependencies", check_imports),
        ("FastAPI Routes", check_routes),
        ("Database", check_database),
        ("Voice Service", check_voice_service),
    ]
    
    results = []
    for name, check_fn in checks:
        try:
            result = check_fn()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Error in {name}: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status:10} {name}")
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n" + "="*60)
        print("🎉 ALL CHECKS PASSED!")
        print("="*60)
        print("\nYou're ready to test the audio flow:")
        print("  1. Start backend: python main.py")
        print("  2. Start frontend: npm run dev")
        print("  3. Open http://localhost:5173 in browser")
        print("  4. Log in with Auth0")
        print("  5. Go to VoiceRecorder section")
        print("  6. Click 'Start Recording' and speak")
        print("  7. Click 'Analyze & Save Preferences'")
        print("  8. See your transcript and extracted preferences!")
        return 0
    else:
        print("\n" + "="*60)
        print("⚠️  SOME CHECKS FAILED")
        print("="*60)
        print("\nFix the issues above, then run this script again.")
        print("\nFor help, see:")
        print("  - AUDIO_SETUP_GUIDE.md")
        print("  - AUDIO_TO_ELEVENLABS_IMPLEMENTATION.md")
        return 1


if __name__ == "__main__":
    sys.exit(main())
