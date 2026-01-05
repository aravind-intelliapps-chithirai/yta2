import os
import subprocess
import sys
import shutil

def detect_environment():
    """
    Detects the current running environment.
    Returns: 'colab', 'kaggle', 'codespaces', or 'generic_linux/local'
    """
    # Check for Google Colab
    if 'google.colab' in sys.modules:
        return 'colab'
    
    # Check for Kaggle
    if 'KAGGLE_KERNEL_RUN_TYPE' in os.environ:
        return 'kaggle'
    
    # Check for GitHub Codespaces
    if os.environ.get('CODESPACES') == 'true':
        return 'codespaces'
    
    return 'generic_linux'

def has_gpu():
    """Checks if a GPU is available via nvidia-smi."""
    if shutil.which("nvidia-smi") is None:
        return False
    try:
        subprocess.check_call(["nvidia-smi"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        return False

def render_remotion_video(project_dir, comp_id, output_path, entry_point="src/index.ts", 
    start_frame=None, 
    end_frame=None):
    """
    Executes Remotion render with robust GPU enforcement for Headless Linux (Colab/Docker).
    """
    env = detect_environment()
    gpu_available = has_gpu()
    
    print(f"⚙️  Environment: {env.upper()} | GPU Present: {gpu_available}")

    command = [
        "npx", "remotion", "render",
        entry_point, comp_id, output_path,
        "--log=info" # Essential for debugging GPU initialization
    ]

    if start_frame is not None and end_frame is not None:
        print(f"🎞️  Rendering specific range: Frames {start_frame} to {end_frame}")
        command.append(f"--frames={start_frame}-{end_frame}")
    elif start_frame is not None:
        # If only start is provided, render just that single frame (useful for thumbnails)
        print(f"📸 Rendering single frame: {start_frame}")
        command.append(f"--frames={start_frame}")

    # --- 1. The Critical Fix: GPU Backend Selection ---
    if gpu_available and env in ['colab', 'kaggle', 'codespaces', 'generic_linux']:
        print("🚀 GPU detected: Forcing ANGLE-EGL backend...")
        
        # 'angle-egl' is the specific mode for Headless Linux with Nvidia Drivers
        # It bypasses the need for an X11 Display.
        command.append("--gl=angle-egl")
        
        # Chromium Flags to force the GPU even if Chrome thinks it's "unsupported"
        chrome_flags = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--ignore-gpu-blocklist",        # Force use of Server GPUs (Tesla T4, etc.)
            "--enable-gpu-rasterization",    # Offload 2D drawing to GPU
            "--enable-zero-copy"             # Speed up memory transfer
        ]
        
        command.append(f"--chromium-options={','.join(chrome_flags)}")

    else:
        # Fallback for CPU-only (Swangle = Software ANGLE)
        # This prevents "missing driver" crashes and starts faster on CPU
        print("💻 No GPU / CPU-only: Using Software Rendering (Swangle)")
        command.append("--gl=swangle")
        
        if env in ['colab', 'kaggle', 'codespaces']:
             command.append("--chromium-options=--no-sandbox,--disable-setuid-sandbox")

    # --- 2. Multi-Process (Always required for Linux speed) ---
    command.append("--enable-multiprocess-on-linux")

    # --- 3. Resource Tuning ---
    if env == 'codespaces':
        command.append("--concurrency=75%") # Prevent OOM kills

    # --- Execution ---
    try:
        print(f"🚀 Starting Render: {comp_id}")
        # print(f"DEBUG Command: {' '.join(command)}") 
        subprocess.run(command, cwd=project_dir, check=True)
        print("✅ Render completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Render failed with error code {e.returncode}")
        raise e

def check_remotion_gpu(project_dir):
    """Prints Remotion's perception of the GPU"""
    try:
        print("🕵️ Checking Remotion GPU access...")
        # This command asks Remotion to report what graphics backend it is using
        cmd = ["npx", "remotion", "gpu", "--gl=angle-egl"] 
        subprocess.run(cmd, cwd=project_dir, check=True)
    except:
        print("⚠️ Could not verify GPU (remotion gpu command failed)")