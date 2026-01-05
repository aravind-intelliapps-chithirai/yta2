#!/bin/bash
set -e
PROJECT_PATH="../"
REMOTION_SRC="$PROJECT_PATH/visual_engine_fact"
OUTPUT_ROOT="$PROJECT_PATH/shorts"
LOCAL_WORKSPACE="$PROJECT_PATH/visual_engine_fact"
FILENAME_TXT="$PROJECT_PATH/vid_out_filename.txt"

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

# 2. Sync Code
#echo "🔄 Syncing latest code..."
#cp -r "$REMOTION_SRC/." "$LOCAL_WORKSPACE/"

# 3. Construct Command
cd "$LOCAL_WORKSPACE"
TEMP_OUT="output/out_video.mp4"

#CMD="npx remotion render src/index.ts NCERT-Shorts-FACT $TEMP_OUT --gl=angle --log=info"
#CMD="npx remotion render src/index.ts NCERT-Shorts-FACT $TEMP_OUT --gl=angle --log=verbose --enable-multiprocess-on-linux" 
CMD="npx remotion render src/index.ts NCERT-Shorts-Fact $TEMP_OUT 
        --concurrency=75% --enable-multiprocess-on-linux --log=verbose --jpeg-quality=80
        --chromium-options=\"--no-sandbox --disable-setuid-sandbox --enable-unsafe-swiftshader 
        --gl=swangle --disable-gpu-watchdog --disable-video-capture-use-gpu-memory-buffer 
        --disable-gpu-rasterization --disable-zero-copy --disable-dev-shm-usage 
        --disable-accelerated-video-decode --disable-accelerated-video-encode 
        --disable-gpu-compositing --enable-features=SharedImageFactory 
        --enable-webgl --disable-features=Vulkan\" " 
#CMD="npx remotion render src/index.ts NCERT-Shorts-FACT $TEMP_OUT --concurrency=2 --enable-multiprocess-on-linux --log=verbose --chromium-options="--enable-unsafe-swiftshader" --timeout=120000" 
#CMD="npx remotion render src/index.ts NCERT-Shorts-FACT $TEMP_OUT --gl=vulkan --log=verbose"

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
