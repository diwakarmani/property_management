#!/bin/bash
# Reapplies fixes to android/ that `expo prebuild` doesn't know about and wipes out
# on every regeneration (android/ is gitignored, so these never persist on their own).
# Run this once after any `npx expo prebuild --platform android` (including --clean).
#
# Fixes applied (see docs/internal/ANDROID_PROGRESS.md > Known Android-Specific Issues
# for the full root-cause writeup of each):
#   1. Gradle wrapper's default networkTimeout (10s) is too short for the ~200MB
#      gradle-8.3-all.zip download and flakes on first connect in this environment.
#   2. Gradle 8.3's jlink-based JDK-image transform (needed for Android's
#      core-for-system-modules.jar) fails under JDK 21 — pin the Android build to
#      JDK 17 without touching the system JAVA_HOME (the Spring Boot backend needs 21).
#   3. kapt (used by expo-image's Glide annotation processing) hits an
#      IllegalAccessError under JDK 17's strong module encapsulation — needs
#      --add-opens flags on both the Gradle daemon and the separate Kotlin compile
#      daemon. NOTE: if a Gradle/Kotlin daemon from before this script ran is still
#      alive, it won't pick up the new args — this script stops daemons for you.

set -euo pipefail
cd "$(dirname "$0")/.."

WRAPPER_PROPS="android/gradle/wrapper/gradle-wrapper.properties"
GRADLE_PROPS="android/gradle.properties"
JDK17_HOME="/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home"

if [ ! -d "android" ]; then
  echo "No android/ directory — run 'npx expo prebuild --platform android' first." >&2
  exit 1
fi

if [ ! -d "$JDK17_HOME" ]; then
  echo "JDK 17 not found at $JDK17_HOME — install it or update JDK17_HOME in this script." >&2
  exit 1
fi

# 1. Bump the flaky network timeout.
sed -i '' 's/^networkTimeout=.*/networkTimeout=60000/' "$WRAPPER_PROPS"

# 2 & 3. Pin JDK 17 + add kapt --add-opens flags, replacing any prior copy of these
# lines so re-running this script is idempotent.
KAPT_OPENS="--add-opens=jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.jvm=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.model=ALL-UNNAMED"

# Strip any lines this script previously added, then re-add them fresh.
grep -v -E '^(org\.gradle\.java\.home=|kotlin\.daemon\.jvmargs=)' "$GRADLE_PROPS" > "$GRADLE_PROPS.tmp"
# Also strip a bare default org.gradle.jvmargs line so we can replace it with the flagged version.
sed -i '' 's/^org\.gradle\.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m *--add-opens.*/org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m/' "$GRADLE_PROPS.tmp"
sed -i '' "s|^org\.gradle\.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m\$|org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m $KAPT_OPENS|" "$GRADLE_PROPS.tmp"
{
  echo ""
  echo "org.gradle.java.home=$JDK17_HOME"
  echo "kotlin.daemon.jvmargs=$KAPT_OPENS"
} >> "$GRADLE_PROPS.tmp"
mv "$GRADLE_PROPS.tmp" "$GRADLE_PROPS"

# Stale daemons started before these properties existed won't pick them up —
# force a clean restart.
(cd android && JAVA_HOME="$JDK17_HOME" ./gradlew --stop) || true
pkill -f "KotlinCompileDaemon" 2>/dev/null || true
pkill -f "GradleDaemon" 2>/dev/null || true

echo "Android Gradle fixes applied. Also remember, on a fresh device:"
echo "  adb shell settings put global verifier_verify_adb_installs 0"
echo "(needed on some OEM devices — e.g. OnePlus/Oppo ColorOS — for Maestro's driver APK to install)."
