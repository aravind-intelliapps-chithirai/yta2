#!/bin/bash
set -e
PROJECT_PATH="../"
REMOTION_SRC="$PROJECT_PATH/visual_engine_tip"
OUTPUT_ROOT="$PROJECT_PATH/shorts"
LOCAL_WORKSPACE="$PROJECT_PATH/visual_engine_tip"
FILENAME_TXT="$PROJECT_PATH/vid_out_filename.txt"
SCENARIO_JSON="$LOCAL_WORKSPACE/public/scenario_data.json"

# INPUT VARIABLES
RENDER_FRAMES="$1"  # First argument passed from Colab

echo "------------------------------------------------"
echo "🎬  STARTING RENDER JOB"
echo "------------------------------------------------"

# 1. Identify Output Filename
if [ ! -f "$FILENAME_TXT" ]; then
    echo "❌ Error: $FILENAME_TXT not found!"
    exit 1
fi

TARGET_NAME=$(cat "$FILENAME_TXT" | tr -d '[:space:]')
if [[ "$TARGET_NAME" != *".mp4" ]]; then
    TARGET_NAME="$TARGET_NAME.mp4"
fi
# 2. GPU Detection
echo "🔍 Detecting GPU availability..."
if command -v nvidia-smi &> /dev/null && nvidia-smi &> /dev/null; then
    HAS_GPU=true
    echo "✅ GPU detected (nvidia-smi available)"
else
    HAS_GPU=false
    echo "⚠️  No GPU detected - using CPU rendering"
fi
# 3. Update scenario JSON with GPU flag
if [ -f "$SCENARIO_JSON" ]; then
    echo "📝 Updating $SCENARIO_JSON with GPU flag: $HAS_GPU"
    
    # Use jq to update the use_gpu field (install jq if not available)
    if command -v jq &> /dev/null; then
        jq --argjson gpu "$HAS_GPU" '.meta.config.use_gpu = $gpu' "$SCENARIO_JSON" > "${SCENARIO_JSON}.tmp"
        mv "${SCENARIO_JSON}.tmp" "$SCENARIO_JSON"
        echo "✅ Updated use_gpu: $HAS_GPU"
    else
        # Fallback: use sed (less reliable but works without jq)
        sed -i "s/\"use_gpu\": *true/\"use_gpu\": $HAS_GPU/g" "$SCENARIO_JSON"
        sed -i "s/\"use_gpu\": *false/\"use_gpu\": $HAS_GPU/g" "$SCENARIO_JSON"
        echo "✅ Updated use_gpu via sed: $HAS_GPU"
    fi
else
    echo "⚠️  Warning: $SCENARIO_JSON not found, skipping GPU flag update"
fi

# 2. Sync Code
#echo "🔄 Syncing latest code..."
#cp -r "$REMOTION_SRC/." "$LOCAL_WORKSPACE/"

# 3. Construct Command
cd "$LOCAL_WORKSPACE"
TEMP_OUT="output/out_video.mp4"

#CMD="npx remotion render src/index.ts NCERT-Shorts-FACT $TEMP_OUT --gl=angle --log=info"
#CMD="npx remotion render src/index.ts NCERT-Shorts-FACT $TEMP_OUT --gl=angle --log=verbose --enable-multiprocess-on-linux" 
#CMD="npx remotion render src/index.ts NCERT-Shorts-Tip $TEMP_OUT --concurrency=75% --enable-multiprocess-on-linux --log=verbose --chromium-options=\"--no-sandbox --disable-setuid-sandbox --enable-unsafe-swiftshader --gl=swangle --disable-gpu-watchdog --disable-video-capture-use-gpu-memory-buffer --disable-gpu-rasterization --disable-zero-copy --disable-dev-shm-usage --disable-accelerated-video-decode --disable-accelerated-video-encode --disable-gpu-compositing --enable-features=SharedImageFactory --enable-webgl --disable-features=Vulkan\" " 
#CMD="npx remotion render src/index.ts NCERT-Shorts-Tip $TEMP_OUT --concurrency=75% --enable-multiprocess-on-linux --log=verbose --chromium-options=\"--no-sandbox --disable-setuid-sandbox --enable-unsafe-swiftshader --gl=swangle --disable-gpu-watchdog --disable-video-capture-use-gpu-memory-buffer --disable-gpu-rasterization --disable-zero-copy --disable-dev-shm-usage --disable-accelerated-video-decode --disable-accelerated-video-encode --disable-gpu-compositing\" " 
#CMD="npx remotion render src/index.ts NCERT-Shorts-FACT $TEMP_OUT --concurrency=2 --enable-multiprocess-on-linux --log=verbose --chromium-options="--enable-unsafe-swiftshader" --timeout=120000" 
#CMD="npx remotion render src/index.ts NCERT-Shorts-FACT $TEMP_OUT --gl=vulkan --log=verbose"

if [ "$HAS_GPU" = true ]; then
    echo "🚀 Building GPU-accelerated render command (ANGLE-EGL)"
    CMD="npx remotion render src/index.ts NCERT-Shorts-Tip $TEMP_OUT \
        --gl=angle-egl \
        --enable-multiprocess-on-linux \
        --log=verbose \
        --chromium-options=\"--no-sandbox,--disable-setuid-sandbox,--ignore-gpu-blocklist,--enable-gpu-rasterization,--enable-zero-copy\""
else
    echo "💻 Building CPU-only render command (Swangle)"
    CMD="npx remotion render src/index.ts NCERT-Shorts-Tip $TEMP_OUT \
        --concurrency=75% \
        --gl=swangle \
        --enable-multiprocess-on-linux \
        --log=verbose \
        --chromium-options=\"--no-sandbox,--disable-setuid-sandbox,--enable-unsafe-swiftshader,--disable-gpu-watchdog,--disable-video-capture-use-gpu-memory-buffer,--disable-gpu-rasterization,--disable-zero-copy,--disable-dev-shm-usage,--disable-accelerated-video-decode,--disable-accelerated-video-encode,--disable-gpu-compositing,--enable-features=SharedImageFactory,--enable-webgl,--disable-features=Vulkan\""
fi

# Add Partial Render flag if specified
if [ ! -z "$RENDER_FRAMES" ]; then
    echo "✂️  Partial Render Detected: Frames [$RENDER_FRAMES]"
    CMD="$CMD --frames=$RENDER_FRAMES"
else
    echo "🎞️  Full Video Render"
fi

echo "⏳ Executing: $CMD"
START_TIME=$(date +%s)

# Execute
$CMD

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 4. Save Output
FINAL_PATH="$OUTPUT_ROOT/$TARGET_NAME"
echo "💾 Saving to Drive: $FINAL_PATH"
#cp "$TEMP_OUT" "$FINAL_PATH"

echo "------------------------------------------------"
echo "✅ RENDER SUCCESS"
echo "⏱️  Time Taken: $DURATION seconds"
echo "📂 Output: $FINAL_PATH"
echo "------------------------------------------------"
